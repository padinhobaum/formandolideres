/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

export type ClimateReminderType = 'monday' | 'friday' | 'sunday'

interface ClimateReminderProps {
  name?: string
  reminderType?: ClimateReminderType
  climateUrl?: string
}

const COPY: Record<ClimateReminderType, { preview: string; eyebrow: string; title: string; body: string; subject: string }> = {
  monday: {
    preview: 'O Clima da Turma desta semana já está liberado.',
    eyebrow: 'NOVA SEMANA',
    title: 'O Clima da Turma já está liberado',
    body: 'Conte como sua turma está se sentindo nesta semana. Sua percepção ajuda a escola a agir com mais cuidado e atenção.',
    subject: 'Clima de Turma disponível! | Formando Líderes',
  },
  friday: {
    preview: 'Lembrete para responder o Clima da Turma desta semana.',
    eyebrow: 'LEMBRETE',
    title: 'Sua percepção faz diferença',
    body: 'Você ainda pode responder o Clima da Turma desta semana. Leva poucos minutos e contribui diretamente com o acompanhamento da sua sala.',
    subject: 'Clima de Turma disponível! | Formando Líderes',
  },
  sunday: {
    preview: 'Hoje é o último dia para responder o Clima da Turma.',
    eyebrow: 'ÚLTIMO DIA',
    title: 'Hoje é o último dia',
    body: 'Ainda dá tempo de registrar como foi a semana da sua turma. Envie sua percepção até o fim de hoje.',
    subject: 'Último dia para responder! | Formando Líderes',
  },
}

export const ClimateReminderEmail = ({
  name,
  reminderType = 'friday',
  climateUrl = 'https://app.formandolideres.org',
}: ClimateReminderProps) => {
  const copy = COPY[reminderType]
  const firstName = name?.trim().split(/\s+/)[0] || 'Líder'

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} width="210" height="auto" alt="Formando Líderes" style={logo} />
          <Section style={accent} />
          <Text style={eyebrow}>{copy.eyebrow}</Text>
          <Heading style={heading}>{copy.title}</Heading>
          <Text style={text}>Olá, {firstName}!</Text>
          <Text style={text}>{copy.body}</Text>
          <Button href={climateUrl} style={button}>Responder Clima da Turma</Button>
          <Text style={support}>Obrigado por representar sua turma e fortalecer uma escola que escuta.</Text>
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
  component: ClimateReminderEmail,
  subject: (data) => COPY[(data.reminderType as ClimateReminderType) || 'friday'].subject,
  displayName: 'Lembrete do Clima da Turma',
  previewData: { name: 'Arthur', reminderType: 'monday', climateUrl: 'https://app.formandolideres.org' },
} satisfies TemplateEntry

const LOGO_URL = 'https://pxomjhnxdpllcmrzdfef.supabase.co/storage/v1/object/public/icons/email%2Flogo-formando-lideres.png'
const BORN_TO_LEAD_URL = 'https://pxomjhnxdpllcmrzdfef.supabase.co/storage/v1/object/public/icons/email%2Fborn-to-lead.png'
const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: '24px 10px' }
const container = { backgroundColor: '#f7f9fb', border: '1px solid #dce5ec', borderRadius: '8px', margin: '0 auto', maxWidth: '560px', padding: '36px 36px 28px' }
const logo = { display: 'block', margin: '0 auto 28px', maxWidth: '210px', height: 'auto' }
const accent = { backgroundColor: '#00518a', borderRadius: '4px', height: '5px', marginBottom: '28px', width: '52px' }
const eyebrow = { color: '#00518a', fontSize: '12px', fontWeight: 'bold' as const, margin: '0 0 10px' }
const heading = { color: '#153047', fontSize: '28px', lineHeight: '1.2', margin: '0 0 24px' }
const text = { color: '#425563', fontSize: '16px', lineHeight: '1.65', margin: '0 0 18px' }
const button = { backgroundColor: '#00518a', borderRadius: '6px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: 'bold' as const, margin: '8px 0 24px', padding: '14px 22px', textDecoration: 'none' }
const support = { color: '#68737d', fontSize: '13px', lineHeight: '1.55', margin: 0 }
const divider = { borderColor: '#dce5ec', margin: '30px 0 22px' }
const seal = { display: 'block', height: 'auto', margin: '0 0 14px', maxWidth: '92px' }
const company = { color: '#425563', fontSize: '11px', fontWeight: 'bold' as const, margin: '0 0 4px' }
const fiscal = { color: '#7a8790', fontSize: '11px', margin: 0 }