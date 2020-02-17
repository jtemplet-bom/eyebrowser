import React from 'react'

import { fromUrl } from 'geotiff'
import { plot } from 'plotty'

interface IProps {}
interface IState {
  cog: COGeoTIFF
}
type PropsWithDefaults = IProps & IDefaultProps

type COGeoTIFF = {
  metadata: object,
  image: any,
  data: any
}

interface IDefaultProps{
  cog: COGeoTIFF
}


const loadCOG = async () => {
  // Data to be used by the LineLayer
  const tiff = await fromUrl('https://water-awra-landscape-tiles.s3-ap-southeast-2.amazonaws.com/IDR00010-20200213-160746-1x-nearest-rgba-bom-radar.tif')
  const image = await tiff.getImage()


  const cog:COGeoTIFF = {
    metadata: image.getGDALMetadata(),
    image: image,
    data: ''
  }

  return cog
}

// DeckGL react component
export default class extends React.PureComponent<IProps, IState> {
  static defaultProps: Partial<PropsWithDefaults> = {}
  canvasRef:any = React.createRef()

  constructor(props: IProps) {
    super(props)

    this.state = {
      cog: {
        metadata: {},
        data: null,
        image: null
      }
    }
  }

  async componentDidMount() {
    this.setState({ cog: await loadCOG() })
  }

  componentWillU

  render() {
    const { image, metadata } = this.state.cog

    if(image) {
      console.log(image)
      console.log(image.getResolution())
      const data = image.readRasters({
        fillValue: 0
      })
      console.log(data)
      const geo = new plot({
        canvas: this.canvasRef.current,
        data: data,
        width: 8192,
        height: 8192,
        domain: [0, 15],
        colorScale: "viridis"
      });
      geo.render();
    }

    return (
      <section>
        <pre>{JSON.stringify(metadata, null, 2)}</pre>
        <canvas ref={this.canvasRef} />
      </section>
    )
  }
}
