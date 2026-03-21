# 💪 Fitcha

Seu caderno de treino digital. Registre categorias de exercício, máquinas e o peso de cada série — tudo salvo localmente no celular.

## Sobre

Fitcha é um app mobile para quem treina e quer acompanhar sua evolução de cargas de forma simples. Sem cadastro, sem nuvem, sem complicação. Abriu, registrou, fechou.

## Funcionalidades

- **Categorias de treino** — organize por grupo muscular (Peito, Costas, Pernas, etc.)
- **Máquinas e exercícios** — adicione cada equipamento dentro da categoria
- **Registro de 3 séries** — anote o peso de cada série individualmente
- **Histórico de evolução** — veja todos os registros anteriores com indicador de progresso (delta)
- **Foto da máquina** — tire uma foto ou escolha da galeria para identificar visualmente cada equipamento
- **Tema claro/escuro** — troca instantânea com preferência salva localmente
- **Remoção com long press** — segure qualquer categoria, máquina ou registro para remover
- **100% offline** — todos os dados ficam no dispositivo via AsyncStorage

## Tech Stack

- **React Native** com Expo (SDK 54)
- **Expo Router** — navegação file-based com tipagem
- **AsyncStorage** — persistência local
- **expo-image-picker** — câmera e galeria
- **expo-linear-gradient** — gradientes nos cards e botões
- **TypeScript** — tipagem em todo o projeto
- **React Compiler** — otimização automática habilitada

## Instalação

```bash
# Clone o repositório
git clone https://github.com/pedrovidaldev/fitcha.git
cd fitcha

# Instale as dependências
npm install

# Rode o projeto
npx expo start
```

### Dependências necessárias

```bash
npx expo install @react-native-async-storage/async-storage expo-linear-gradient expo-image-picker
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
