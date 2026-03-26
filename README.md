# 💪 Fitcha

Sua ficha de treino digital. Organize seus treinos por dia da semana, registre cargas e acompanhe sua evolução — tudo direto no celular.

## Sobre

Fitcha é um app mobile para quem treina e quer acompanhar sua evolução de forma prática. Sem planilha, sem complicação. Monte sua semana, inicie o treino e registre os pesos conforme avança nas máquinas.

## Funcionalidades

- **Semana visual** — veja seus 7 dias com as categorias de cada treino, com destaque no dia atual
- **Organização por dia** — adicione máquinas a qualquer dia da semana com nome, descrição e categoria predefinida (Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Core, Cardio)
- **Treino ativo** — inicie o treino do dia com timer global e preencha o peso de cada máquina, uma por vez, em um fluxo guiado
- **Registro de 3 séries** — anote o peso de cada série individualmente durante o treino
- **Histórico de evolução** — consulte todos os registros anteriores de cada máquina
- **Foto da máquina** — tire uma foto ou escolha da galeria para identificar visualmente cada equipamento
- **Notificações** — receba lembretes automáticos nos dias de treino às 7h da manhã
- **Wizard de treino com IA** — gere um plano de treino personalizado informando altura, peso, dias disponíveis, intensidade e objetivo
- **Tema claro/escuro** — troca instantânea com preferência salva localmente
- **Remoção com long press** — segure qualquer máquina para remover

## Fluxo do App

```
Semana → Dia → Detalhe da Máquina (histórico)
                ↘ Iniciar Treino → Máquina 1 → Máquina 2 → ... → Finalizar
```

1. **Semana** — cards dos 7 dias mostrando badges das categorias. Long press para adicionar máquinas
2. **Dia** — lista de máquinas com foto, categoria e último peso. Botão "Iniciar treino"
3. **Detalhe** — histórico completo de pesos (somente leitura)
4. **Treino ativo** — timer no topo, uma máquina por vez, 3 inputs de série. Avança ao preencher ou pula

## Tech Stack

- **React Native** com Expo (SDK 54)
- **React Navigation** — navegação com stack tipada
- **AsyncStorage** — persistência local
- **expo-notifications** — notificações locais semanais
- **expo-image-picker** — câmera e galeria
- **expo-linear-gradient** — gradientes nos cards e botões
- **TypeScript** — tipagem em todo o projeto
- **React Compiler** — otimização automática habilitada

## Instalação

```bash
# Clone o repositório
git clone https://github.com/PedroVidalDev/fitcha.git
cd fitcha/frontend

# Instale as dependências
npm install

# Rode o projeto
npx expo start
```

### Dependências necessárias

```bash
npx expo install @react-native-async-storage/async-storage expo-linear-gradient expo-image-picker expo-notifications expo-device
```

## Build (APK)

O projeto usa **EAS Build** com GitHub Actions. A cada push na `main`, um APK é gerado automaticamente e publicado como GitHub Release.

Para buildar manualmente:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Download

Acesse a aba [Releases](../../releases) para baixar o APK mais recente.

## Licença

MIT