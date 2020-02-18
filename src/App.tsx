import React from 'react'

import { addColorScale, plot } from 'plotty'
import { fromUrl } from 'geotiff'

interface IProps {}
interface IState {
  cog: COGeoTIFF
  imageData: string
  palette: string
  step: number
}
type PropsWithDefaults = IProps & IDefaultProps

type COGeoTIFF = {
  gdal: object,
  image: any,
  data: any
}

interface IDefaultProps{}


const loadCOG = async (filepath) => {
  // Data to be used by the LineLayer
  const tiff = await fromUrl(filepath)
  //const tiff = await fromUrl('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/IDE01452.201807120300.tif')
  const image = await tiff.getImage()

  const cog:COGeoTIFF = {
    data: '',
    gdal: image.getGDALMetadata(),
    image: image,
  }

  console.log(cog)

  return cog
}

const plottyAvailablePalettes = [
  'viridis', 'inferno', 'rainbow',
  'jet', 'hsv', 'hot',
  'cool', 'spring', 'summer',
  'autumn', 'winter', 'bone',
  'copper', 'greys', 'yignbu',
  'greens', 'yiorrd', 'bluered',
  'rdbu', 'picnic', 'portland',
  'blackbody', 'earth', 'electric',
  'magma', 'plasma'
]
const getPalette = () => plottyAvailablePalettes[Symbol.iterator]()

const clamp = (value: number, min: number, max: number):number => {
  const clamped = Math.min(Math.max(value, min), max)

  return clamped
}

// DeckGL react component
export default class extends React.PureComponent<IProps, IState> {
  static defaultProps: Partial<PropsWithDefaults> = {}
  canvasRef:any = React.createRef()
  paletteGenerator = getPalette()

  constructor(props: IProps) {
    super(props)

    this.state = {
      cog: {
        gdal: {},
        data: null,
        image: null
      },
      imageData: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      palette: this.paletteGenerator.next().value,
      step: 0
    }
  }

  async componentDidMount() {
    const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/radartifs/radar-cog.tif')

    const width = 1024
    const height = 1024
    const x = 5632
    const y = 5632
    //const pool = new GeoTIFF.Pool()
    
    cog.data = await cog.image.readRasters({
      //pool,
      window: [x, y, x+width, y+height],
      width: width/2,
      height: height/2,
      samples: [0,1,2,3,4,5,6,7],
      resampleMethod: 'nearest'
    })

    this.setState({ cog })
  }

  changePalette() {
    let next = this.paletteGenerator.next()

    if(next.done){
      this.paletteGenerator = getPalette()
      next = this.paletteGenerator.next()
    }
    this.setState({ palette: next.value})
  }

  step(step: number) {
    const delta = this.state.step + step
    const result = clamp((delta), 0, this.state.cog.data.length-1)

    this.setState({ step: result })
  }

  render() {
    const { data } = this.state.cog

    if(data){
      const radar = new plot({
        canvas: this.canvasRef.current,
      });

      /*
      const { gl } = radar
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      */
      /*
      const input = data[0].map((item) => {
        if(item < 255 ) {
          return item
        }
        return '0'
      })
      */
      const input = data[this.state.step]

      addColorScale("radar", ["#00000000", "#00ffffff"], [0, 1]);
      radar.setColorScale(this.state.palette)
      radar.setDomain([0, 15])
      radar.setNoDataValue(0)
      radar.setData(input, data.width, data.height)
      console.log(window.innerWidth, window.innerHeight)
      radar.render()
      //this.setState({imageData: this.canvasRef.current.toDataURL()})
    }

    return (
      <section>
        <canvas ref={this.canvasRef} style={{
        backgroundColor: '#000000',
        display: 'block',
        //width: '100vw',
        height: '100vh'
        }} />
        <nav style={{
            top: '10px',
            left: '10px',
            position: 'absolute',
          }}>
          <button onClick={() => { this.changePalette() }}>Woah! {this.state.palette}</button>
          <button onClick={() => { this.step(-1) }}>Prev</button>
          <button onClick={() => { this.step(1) }}>Next</button>
        </nav>

        <pre>{JSON.stringify(this.state.cog.gdal, null, 2)}</pre>
        
        {/*<img alt="a visual representation of rainfall" src={this.state.imageData} /> */}
      </section>
    )
  }
}
