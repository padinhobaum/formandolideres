/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ClimateConfirmationProps {
  name?: string
  className?: string
}

const ClimateConfirmationEmail = ({ name, className }: ClimateConfirmationProps) => {
  const firstName = name?.trim().split(/\s+/)[0] || 'Líder'

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Parabéns por colaborar com o Clima da Turma!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} width="210" height="auto" alt="Formando Líderes" style={logo} />
          <Section style={check}>✓</Section>
          <Heading style={heading}>Parabéns por colaborar!</Heading>
          <Text style={text}>Olá, {firstName}!</Text>
          <Text style={text}>
            Sua resposta sobre o Clima da Turma{className ? ` da sala ${className}` : ''} foi registrada com sucesso.
          </Text>
          <Text style={support}>Sua escuta e participação ajudam a construir uma escola mais atenta, acolhedora e preparada para agir.</Text>
          <Hr style={divider} />
          <Img src={BORN_TO_LEAD_URL} width="92" height="auto" alt="Born to Lead" style={seal} />
          <Text style={company}>Formando Líderes Educação e Tecnologia LTDA.</Text>
          <Text style={fiscal}>CNPJ 68.002.639/0001-40</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ClimateConfirmationEmail,
  subject: 'Parabéns por colaborar com o Clima da Turma!',
  displayName: 'Confirmação do Clima da Turma',
  previewData: { name: 'Arthur', className: 'LJ' },
} satisfies TemplateEntry

const LOGO_URL = 'https://pxomjhnxdpllcmrzdfef.supabase.co/storage/v1/object/public/icons/email%2Flogo-formando-lideres.webp'
const BORN_TO_LEAD_URL = 'https://pxomjhnxdpllcmrzdfef.supabase.co/storage/v1/object/public/icons/email%2Fborn-to-lead.webp'
const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: '24px 10px' }
const container = { backgroundColor: '#f7f9fb', border: '1px solid #dce5ec', borderRadius: '8px', margin: '0 auto', maxWidth: '560px', padding: '36px 36px 28px' }
const logo = { display: 'block', margin: '0 auto 28px', maxWidth: '210px', height: 'auto' }
const check = { backgroundColor: '#00518a', borderRadius: '999px', color: '#ffffff', fontSize: '28px', fontWeight: 'bold' as const, height: '52px', lineHeight: '52px', margin: '0 0 22px', textAlign: 'center' as const, width: '52px' }
const heading = { color: '#153047', fontSize: '28px', lineHeight: '1.2', margin: '0 0 24px' }
const text = { color: '#425563', fontSize: '16px', lineHeight: '1.65', margin: '0 0 18px' }
const support = { color: '#68737d', fontSize: '14px', lineHeight: '1.6', margin: 0 }
const divider = { borderColor: '#dce5ec', margin: '30px 0 22px' }
const seal = { display: 'block', height: 'auto', margin: '0 0 14px', maxWidth: '92px' }
const company = { color: '#425563', fontSize: '11px', fontWeight: 'bold' as const, margin: '0 0 4px' }
const fiscal = { color: '#7a8790', fontSize: '11px', margin: 0 }