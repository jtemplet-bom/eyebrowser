import React from 'react'

import { addColorScale, plot } from 'plotty'
import { fromUrl } from 'geotiff'
import { initCanvasGL, handleLoadedImage } from './shaders/shaders'

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
  'viridis', 'inferno', 'jet',
  'hot', 'bone', 'copper',
  'greys', 'yignbu', 'greens',
  'yiorrd', 'rdbu', 'picnic',
  'portland', 'blackbody', 'earth',
  'electric',  'magma', 'plasma'
]

const getPalette = () => plottyAvailablePalettes[Symbol.iterator]()

const clamp = (value: number, min: number, max: number):number => {
  const clamped = Math.min(Math.max(value, min), max)

  return clamped
}

const getCanvasImage = (canvas) => {
  return canvas.toDataURL()
  const ctx = canvas.getContext("webgl")
  console.log(canvas, ctx)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
  /*
  const image = new Image()
  await canvas.toBlob((blob: Blob) => {
    image.src = URL.createObjectURL(blob)
    console.log(image)
  })
  return image*/
}

// DeckGL react component
export default class extends React.PureComponent<IProps, IState> {
  static defaultProps: Partial<PropsWithDefaults> = {}
  canvasRef:any = React.createRef()
  shaderRef:any = React.createRef()
  imageRef:any = React.createRef()
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
    // const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/radartifs/radar-cog.tif')
    const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/monthly_ss_forecast_sample.tif')
    // const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/rain_day_2019.tif')

    const width = cog.image.fileDirectory.ImageWidth
    const height = cog.image.fileDirectory.ImageLength
    const x = 0
    const y = 0
    //const pool = new GeoTIFF.Pool()

    cog.data = await cog.image.readRasters({
      //pool,
      window: [x, y, x+width, y+height],
      width: width,
      height: height,
      // samples: [0],
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
    console.log(result, this.state.cog.data.length-1)
    this.setState({ step: result })
  }

  render() {
    const { data } = this.state.cog

    if(data){
      const radar = new plot({
        canvas: this.canvasRef.current,
      });

      //const input = data[this.state.step]

      // addColorScale("radar", ["#00000000", "#00ffffff"], [0, 1]);
      radar.setColorScale(this.state.palette)
      // radar.setDomain([0, 15])
      // radar.setNoDataValue(0)
      radar.setData(data[this.state.step], data.width, data.height)
      radar.render()
      /*
      // initalise shaders
      const gl = initCanvasGL(this.canvasRef.current)
      const image = getCanvasImage(radar.getCanvas())
      console.log(image)
      handleLoadedImage(this.canvasRef.current, this.canvasRef.current, window.innerWidth, window.innerHeight)
      //this.setState({imageData: this.canvasRef.current.toDataURL()})
      */
    }

    return (
      <section>
        <canvas ref={this.canvasRef} style={{
          backgroundColor: '#000000',
          display: 'hidden',
          //width: '100vw',
          height: '100vh'
        }} />
        <canvas ref={this.shaderRef} style={{
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
          <button onClick={() => { this.changePalette() }}>{this.state.palette}</button>
          <button onClick={() => { this.step(-1) }}>Prev</button>
          <button onClick={() => { this.step(1) }}>Next</button>
          <img ref={this.imageRef} />
        </nav>

        <pre>{JSON.stringify(this.state.cog.gdal, null, 2)}</pre>

        {/*<img alt="a visual representation of rainfall" src={this.state.imageData} /> */}
      </section>
    )
  }
}
