/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Img } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://pxomjhnxdpllcmrzdfef.supabase.co/storage/v1/object/public/icons/email%2Flogo-formando-lideres.webp'

export const BrandHeader = () => (
  <Img
    src={LOGO_URL}
    width="190"
    height="auto"
    alt="Formando Líderes"
    style={logo}
  />
)

const logo = {
  display: 'block',
  margin: '0 auto 28px',
  maxWidth: '190px',
  height: 'auto',
}