import React from 'react'

import { plot } from 'plotty'
import { fromUrl } from 'geotiff'
import glslCanvas from 'glslCanvas'

import { fBicubic, fPassthrough, fFXAA, vFXAA, vPassthrough } from './shaders/shaders'

interface IProps {}
interface IState {
  cog: COGeoTIFF
  glParams: object
  imageData: string
  palette: string
  shader: object
  step: number
}
type PropsWithDefaults = IProps & IDefaultProps

type COGeoTIFF = {
  gdal: object,
  image: any,
  data: any
}

type shaderDef = {
  name: string,
  frag: any,
  vertex?: string
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

  console.log(`COG::${filepath} loaded`, cog)

  return cog
}

const availablePalettes = [
  'blackbody', 'viridis', 'inferno', 'jet', 'hot', 'bone', 'copper', 'greys', 'yignbu', 'greens', 'yiorrd', 'rdbu', 'picnic', 'portland', 'earth', 'electric',  'magma', 'plasma'
]

const getPalette = () => availablePalettes[Symbol.iterator]()

const DEFAULT_VERTEX_SHADER = vPassthrough.default
const DEFAULT_FRAGMENT_SHADER = fPassthrough.default // eslint-disable-line @typescript-eslint/no-unused-vars

const availableShaders:Array<shaderDef> = [
  { name: 'no shader', frag: fPassthrough.default },
  { name: 'fxaa', frag: fFXAA.default, vertex: vFXAA.default },
  { name: 'bicubic', frag: fBicubic.default },
  //{ name: 'VHS', frag: fVHS.default }
]

const getShader = (): IterableIterator<shaderDef> => availableShaders[Symbol.iterator]()

const clamp = (value: number, min: number, max: number):number => {
  const clamped = Math.min(Math.max(value, min), max)

  return clamped
}

export default class extends React.PureComponent<IProps, IState> {
  static defaultProps: Partial<PropsWithDefaults> = {}
  glCanvas:any
  canvasRef:any = React.createRef()
  shaderRef:any = React.createRef()
  imageRef:any = React.createRef()
  paletteIterator = getPalette()
  shaderIterator = getShader()

  constructor(props: IProps) {
    super(props)

    this.state = {
      cog: {
        gdal: {},
        data: null,
        image: null
      },
      glParams: {},
      imageData: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      palette: this.paletteIterator.next().value,
      shader: this.shaderIterator.next().value as shaderDef,
      step: 0
    }
    console.log(this.state)
  }


  async componentDidMount() {
    const shader: Partial<shaderDef>  = this.state.shader
    this.glCanvas = new glslCanvas(this.shaderRef.current)
    this.glCanvas.load(shader.frag, shader.vertex ? shader.vertex : DEFAULT_VERTEX_SHADER)

    const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/radartifs/radar-cog.tif')
    //const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/forecast_sample.tif')
    // const cog = await loadCOG('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/rain_day_2019.tif')

    const { gl } = this.glCanvas
    const glParams = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
    }

    const width = 1024 //cog.image.fileDirectory.ImageWidth
    const height = 1024 //cog.image.fileDirectory.ImageLength
    const x = 5620
    const y = 6628
    //const pool = new GeoTIFF.Pool()

    cog.data = await cog.image.readRasters({
      //pool,
      window: [x, y, x+width, y+height],
      width,
      height,
      samples: [0, 1, 2, 3, 4, 5, 6, 7],
    })

    this.setState({ cog, glParams })
  }

  componentDidUpdate(prevProps: IProps, prevState: IState) {
    const shader:Partial<shaderDef> = this.state.shader

    this.glCanvas.load(shader.frag, shader.vertex ? shader.vertex : DEFAULT_VERTEX_SHADER)
  }

  changePalette() {
    let next = this.paletteIterator.next()

    if(next.done){
      this.paletteIterator = getPalette()
      next = this.paletteIterator.next()
    }
    this.setState({ palette: next.value})
  }

  changeShader(event) {
    event.preventDefault()
    event.stopPropagation()

    let next = this.shaderIterator.next()

    if(next.done){
      this.shaderIterator = getShader()
      next = this.shaderIterator.next()
    }

    this.setState({ shader: next.value })
  }

  step(step: number) {
    const delta = this.state.step + step
    const result = clamp((delta), 0, this.state.cog.data.length-1)

    this.setState({ step: result })
  }

  render() {
    const { cog, palette, step } = this.state
    const shader: Partial<shaderDef>  = this.state.shader
    let { data } = cog

    if(data){
      //this.canvasRef.current.width = `${data.width * scale}px`
      //this.canvasRef.current.height = `${data.height * scale}px`
      const radar = new plot({
        canvas: this.canvasRef.current,
        width: data.width,
        height: data.height
      });

      radar.setColorScale(palette)
      radar.setDomain([1, 15])
      radar.setNoDataValue(-1)
      radar.setData(data[step], data.width, data.height)
      radar.render()
      this.glCanvas.setUniform('u_image', this.canvasRef.current.toDataURL())
      // console.log(this.glCanvas.uniforms)
    }

    return (
      <section>
        <canvas ref={this.shaderRef} style={{
            backgroundColor: '#000000',
            display: 'block',
            float: 'left',
            width: data ? data.width*2 : '50vw',
            height: data ? data.height*2 : 0,
          }} />
          <canvas ref={this.canvasRef} style={{
            backgroundColor: '#000000',
            float: 'left',
            width: data ? data.width : '50vw',
            height: data ? data.height : 0,
        }} />
        <nav style={{
            top: '10px',
            left: '10px',
            position: 'fixed',
          }}>
          <button onClick={() => { this.changePalette() }}>{palette}</button>
          <button
            key={'changeShader'}
            onContextMenu={(event) => { this.changeShader(event) }}
            onClick={(event) => { this.changeShader(event) }}
          >{shader.name}</button>
          <button onClick={() => { this.step(-1) }}>Prev</button>
          <button onClick={() => { this.step(1) }}>Next</button>
        </nav>

        <pre>{JSON.stringify(this.state.cog.gdal, null, 2)}</pre>

        {/*<img alt="a visual representation of rainfall" src={this.state.imageData} /> */}
      </section>
    )
  }
}
