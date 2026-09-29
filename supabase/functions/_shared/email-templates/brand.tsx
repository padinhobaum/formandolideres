/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Img } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://app.formandolideres.org/__l5e/assets-v1/8410690f-68d0-4655-8708-889dbadf317b/logo-fl-full.png'

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