---
name: Home — Insights e Avisos
description: Card "Painel Executivo" exclusivo para admins na Home (acima de tudo, abaixo do banner). Limite de 3 avisos na Home com "Ver todos". Avatares de repasse aparecem nos cards do Mural e da Home antes de abrir.
type: feature
---

## Estrutura na Home (após banner)

1. **Apenas Admin**: `<AdminInsightsCard />` — gradient premium, 4 stat tiles (Clima, Participação, Online, Engajamento 7d), insights automáticos coloridos por tom (positive/neutral/warning).
2. **Apenas Líder**: `<ClassClimateCard />` — termômetro de clima.
3. Em seguida: Calendário, Avisos, Videoaulas, Fórum.

## Avisos na Home

- **Máximo de 3 avisos**, ordenados por `is_pinned DESC, created_at DESC`.
- Botão "Ver todos" no header da seção sempre visível, navega para `/mural`.
- Layout: grid 4 colunas no desktop. Primeiro aviso fixado ocupa 2 colunas (variant `featured`).

## Avatares de Repasse (`<RelayAvatars />`)

- Componente reusável em `src/components/RelayAvatars.tsx`.
- Aparece **automaticamente** nos cards (variants `featured` e `default`) do `NoticeCard` quando `requires_relay = true`, ANTES de abrir o aviso.
- Avatares circulares sobrepostos (`-space-x-1.5`), com ring no card, e indicador `+N` quando excede `maxVisible` (default 4).
- Tooltip com nome ao passar o mouse. Visual em emerald (verde) para indicar confirmação.
- Usado também no `NoticeRelayButton` (versão completa do detail) e no `NoticeCard` (versão `compact={false}` premium).

## AdminInsightsCard

- Calcula automaticamente: média semanal de clima, delta vs semana anterior, melhor/pior sala, low mood count, taxa de participação (responses / total leaders), online agora, engajamento 7d (tópicos + avisos).
- Usa `app_role = 'leader'` para contar líderes (não 'user').
- Insights em chips com tom `positive` (emerald), `neutral` (primary), `warning` (amber).
