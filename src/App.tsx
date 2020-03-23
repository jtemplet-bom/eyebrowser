import React, { CSSProperties } from 'react'
import { addColorScale, plot as Plot } from 'plotty'
import { fromUrl, Pool } from 'geotiff'
import { getStats } from 'geotiff-stats'
import GlslCanvas from "glsl-canvas-js"
import {
  fBicubic, fPassthrough, fFXAA, vPassthrough, fCRTLottes, fCRTLottes2, fPhosphorish, fGlow, f6xbrz, v6xbrz, fCrossfade
} from './shaders/shaders'


interface IProps {}

interface IDefaultProps{}
type PropsWithDefaults = IProps & IDefaultProps

interface IState {
  cog: COGeoTIFF
  glParams: object
  imageData: string
  palette: string
  shader: shaderDef
  step: number
  domainMin: number
  domainMax: number
}

type GeoTIFFStatItems = {
  min: number
  max: number
}

type GeoTIFFStats  = {
  bands:  GeoTIFFStatItems[]
}

type COGeoTIFF = {
  gdal: object
  image: any
  data: any
  stats?: GeoTIFFStats
  overview?: object
}

type shaderDef = {
  name: string
  frag?: string
  vertex?: string
}

type paletteDef = {
  colours: string[]
  name: string
  stops: number[]
}

const loadCOG = async (filepath: string) => {
  const tiff = await fromUrl(
    filepath,
    {
      cache: true,
    }
  )
    const imageCount = await tiff.getImageCount()
  const overview = await tiff.getImage(imageCount - 1)
  const image = await tiff.getImage()
  const stats:GeoTIFFStats = await getStats(overview)

  const cog:COGeoTIFF = {
    data: '',
    gdal: image.getGDALMetadata(),
    image,
    overview,
    stats,
  }

  console.log(`COG::${filepath} loaded`, cog)

  return cog
}

const STOPS_RADAR_FLAT = [
  0, 1/(16/1), 1/(16/2), 1/(16/3), 1/(16/4), 1/(16/5), 1/(16/6), 1/(16/7), 1/(16/8), 1/(16/9), 1/(16/10), 1/(16/11), 1/(16/12), 1/(16/13), 1/(16/14), 1/(16/15), 1
]


const availablePalettes = [
  'blackbody', 'viridis', 'inferno', 'jet', 'hot', 'bone', 'copper', 'greys', 'yignbu', 'greens', 'yiorrd', 'rdbu', 'picnic', 'portland', 'earth', 'electric', 'magma', 'plasma'
]

const palettes: paletteDef[] = [
  {
    name: 'radar-old',
    colours: [
    '#00000000', '#f5f5ff00', '#b4b4ff40', '#7778ff80', '#1314ffc0', '#00d9c4ff', '#02968fff', '#006666ff', '#ffff00ff', '#ffc800ff', '#ff9600ff', '#ff6400ff', '#ff0100ff', '#c80000ff', '#780000ff', '#290000ff', '#290000ff'
    ],
    stops: STOPS_RADAR_FLAT
  },
  {
    name: 'radar-new',
    colours: [
     '#00000000', '#0092ec53', '#0092ec66', '#0092ec99', '#0092eccc', '#2461f5ff', '#0d4addff', '#0d4addff', '#6400a7ff', '#6400a7ff', '#510070ff', '#510070ff', '#3c003aff', '#3c003aff', '#000000ff', '#000000ff', '#000000ff'
    ],
    stops: STOPS_RADAR_FLAT
  }
]

palettes.forEach(palette => {
  addColorScale(palette.name, palette.colours, palette.stops)
  availablePalettes.push(palette.name)
})

const getPalette = () => availablePalettes[Symbol.iterator]()

const shaderDefaults = { VERTEX: vPassthrough.default, FRAGMENT: fPassthrough.default }

const availableShaders:Array<shaderDef> = [
  { name: 'no shader' },
  { name: '6x brz', frag: f6xbrz.default, vertex: v6xbrz.default },
  { name: 'fxaa', frag: fFXAA.default },
  { name: 'bicubic', frag: fBicubic.default },
  { name: 'glow', frag: fGlow.default },
  { name: 'lottes', frag: fCRTLottes.default },
  { name: 'phosphorish', frag: fPhosphorish.default },
  { name: 'crossfade', frag: fCrossfade.default },

  // { name: 'lottes2', frag: fCRTLottes2.default },
  // { name: 'VHS', frag: fVHS.default }
]

const getShader = (): IterableIterator<shaderDef> => availableShaders[Symbol.iterator]()

const clamp = (value: number, min: number, max: number):number => {
  const clamped = Math.min(Math.max(value, min), max)

  return clamped
}

// const TIF_HOST = 'https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com'
const TIF_HOST = 'https://d1l0fsdtqs1193.cloudfront.net'
const DOMAIN_MIN = 0
const DOMAIN_MAX = 15
const PLOT_WIDTH = 960
const PLOT_HEIGHT = 720

export default class extends React.PureComponent<IProps, IState> {
  static defaultProps: Partial<PropsWithDefaults> = {}
  glCanvas:any
  canvasRef:any = React.createRef()
  shaderRef:any = React.createRef()
  paletteIterator = getPalette()
  shaderIterator = getShader()

  radar = new Plot({
    canvas: this.canvasRef.current,
    width: 1,
    height: 1
  })
  constructor(props: IProps) {
    super(props)

    this.state = {
      cog: {
        gdal: { loading: true },
        data: null,
        image: null,
        stats: {
          bands: [
            {
              min: DOMAIN_MIN,
              max: DOMAIN_MAX
            }
          ] as GeoTIFFStatItems[]
        } as GeoTIFFStats
      },
      glParams: {},
      imageData: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      palette: availablePalettes[0],
      shader: availableShaders[0],
      step: 0,
      domainMin: DOMAIN_MIN,
      domainMax: DOMAIN_MAX
    }
  }


  async componentDidMount() {
    const { shader, step } = this.state
    this.glCanvas = new GlslCanvas(this.shaderRef.current)

    this.glCanvas.load(
      shader.frag ? shader.frag : shaderDefaults.FRAGMENT,
      shader.vertex ? shader.vertex : shaderDefaults.VERTEX
    )

    const cog = await loadCOG(`${TIF_HOST}/radartifs/radar-cog.tif`)
    //const cog = await loadCOG(`${TIF_HOST}/forecast_sample.tif`)
    // const cog = await loadCOG(`${TIF_HOST}/rain_day_2019.tif`)
    const { ImageWidth, ImageLength } = cog.image.fileDirectory

    const { gl } = this.glCanvas
    const glParams = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
    }

    const xMax = ImageWidth <= glParams.maxTextureSize ? ImageWidth : glParams.maxTextureSize
    const yMax = ImageLength <= glParams.maxTextureSize ? ImageLength : glParams.maxTextureSize
    const width = PLOT_WIDTH || xMax
    const height = PLOT_HEIGHT || yMax
    const x = 5500
    const y = 6500
    // const pool = new Pool()

    const data = await cog.image.readRasters({
      // pool,
      window: [x, y, x + width, y + height],
      // window: [0, 0, xMax, yMax],
      width: width*8,
      height: height*8,
      samples: [0, 1, 2],
      resampleMethod: 'bilinear',
    })
    cog.data = data

    // this.canvasRef.current.width = `${data.width * scale}px`
      // this.canvasRef.current.height = `${data.height * scale}px`
    this.radar = new Plot({
      canvas: this.canvasRef.current,
      width: width,
      height: height
    })
    this.radar.setDomain([1, 15])
    this.radar.setNoDataValue(0)
    this.radar.setData(data[step], data.width, data.height)
    this.radar.render()
    this.glCanvas.setTexture('u_image', this.radar.getCanvas())
    this.glCanvas.setTexture('u_previous', this.radar.getCanvas())

    this.update({ cog, glParams })
  }

  async digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
  }


  getSnapshotBeforeUpdate(prevProps: IProps, prevState: IState) {
    if(prevState.step !== this.state.step){
    this.glCanvas.setTexture('u_previous', this.radar.getCanvas())
      return true
    }
    return null
  }

  componentDidUpdate(prevProps: IProps, prevState: IState, snapshot: any) {
    const { cog, palette, shader, step, domainMin, domainMax } = this.state
    const { data, stats } = cog
    const { gl, program } = this.glCanvas

    //console.log(this.state.imageData)
    //const previous = gl.getUniform(program, gl.getUniformLocation(program, 'u_image'))

    if (data && stats && stats.bands) {
      // this.canvasRef.current.width = `${data.width * scale}px`
      // this.canvasRef.current.height = `${data.height * scale}px`
      this.radar.setColorScale(palette)
      this.radar.setDomain([domainMin, domainMax])
      //this.radar.setDomain([1, 15])
      this.radar.setNoDataValue(0)
      this.radar.setData(data[step], data.width, data.height)
      this.radar.render()

      this.glCanvas.setTexture('u_image', this.radar.getCanvas())
      this.glCanvas.setUniform('u_frame', step)
    }

    this.glCanvas.load(
      shader.frag ? shader.frag : shaderDefaults.FRAGMENT,
      shader.vertex ? shader.vertex : shaderDefaults.VERTEX
    )
  }

  changePalette(event) {
    event.preventDefault()
    event.stopPropagation()
    const next = availablePalettes.find((palette) => palette === event.target.value)

    if(next) {
      this.update({ palette: next })
    }
  }

  changeShader(event) {
    event.preventDefault()
    event.stopPropagation()

    const next = availableShaders.find((shader) => shader.name === event.target.value)

    if(next) {
      this.update({ shader: next })
    }
  }

  step(step: number) {
    const delta = this.state.step + step
    const result = clamp((delta), 0, this.state.cog.data.length - 1)

    this.update({ step: result })
  }

  rangeOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = event.target
    if(name in this.state) {
      const newState = {}
      newState[name] = event.target.value
      this.update(newState)
    } else {
      throw Error(`InvalidStateError: ${name} is not in IState`)
    }
  }

  update(state){
    requestAnimationFrame(() => {
      //console.log(this.canvasRef.current.toDataURL('image/gif'))
      this.setState(state)
    })
  }

  render() {
    const { cog, palette, shader, step } = this.state
    const { data, stats } = cog
    const { min, max } = stats && stats.bands ? stats.bands[0] : { min: DOMAIN_MIN, max: DOMAIN_MAX }

    const paletteOptions = availablePalettes.map((aPalette) => <option key={aPalette} value={aPalette}>{aPalette}</option>)
    const shaderOptions = availableShaders.map((aShader) => <option key={aShader.name} value={aShader.name}>{aShader.name}</option>)

    const controlStyle:CSSProperties = {
      fontFamily: 'monospace',
      fontSize: '1rem',
      fontWeight: 900,
      textTransform: 'lowercase',
      padding: '1rem',
      margin: '2px',
      border: '1px solid #aaaaaa',
      backgroundColor: "#000000cc",
      color: "#cccccc",
      cursor: "pointer"
    }

    return (
      <section>
        <canvas ref={this.shaderRef} style={{
          display: 'block',
          float: 'left',
          width: PLOT_WIDTH,
          height: PLOT_HEIGHT,
        }} />
          <canvas id='bob' ref={this.canvasRef} style={{
            display: 'block',
            float: 'left',
            width: PLOT_WIDTH,
            height: PLOT_HEIGHT,
          }} />
        <nav style={{
          top: '10px',
          left: '10px',
          position: 'fixed',
          fontSize: '2rem',
        }}>
          <select
            key={'changePalette'}
            value={palette}
            style={controlStyle}
            onChange={(event) => { this.changePalette(event) }}
          >
            {paletteOptions}
          </select>
          <select
            key={'changeShader'}
            value={shader.name}
            style={controlStyle}
            onChange={(event) => { this.changeShader(event) }}
          >
            {shaderOptions}
          </select>
          <input type="range" name="domainMin" onChange={this.rangeOnChange} min={min} max={max} />
          <input type="range" name="domainMax" onChange={this.rangeOnChange} min={min} max={max} />
          <button style={controlStyle} onClick={() => { this.step(-1) }}>Prev</button>
          <button style={controlStyle} onClick={() => { this.step(1) }}>Next</button>
        </nav>

        <pre style={{
          display: 'block',
          clear: 'both',
        }}>
          {/*JSON.stringify({ ...cog.gdal, ...cog.stats || null }, null, 2)*/}
          {/* fakey ? <img src={fakey} /> : null */}
        </pre>
        {/*}
        <pre style={{
          display: 'block',
          clear: 'both',
        }}>
          {JSON.stringify({ ...cog.image ? { ...cog.image.getGeoKeys(), ...cog.image.fileDirectory } : null }, null, 2)}
        </pre>
        /*}
        {/* <img alt="a visual representation of rainfall" src={this.state.imageData} /> */}
      </section>
    )
  }
}
