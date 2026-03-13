# UTM Test URLs

Base local usada nos exemplos:

```txt
http://localhost:3001
```

Se for testar em outro ambiente, troque apenas o domínio.

## 1. Testes com `ref`

Use estes links quando a URL personalizada vier de um `TrackingLink` salvo no admin:

```txt
http://localhost:3001/?ref=influencer-maria-instagram
http://localhost:3001/?ref=influencer-joao-tiktok
http://localhost:3001/?ref=ads-meta-video-01
http://localhost:3001/?ref=ads-google-search-brand
http://localhost:3001/?ref=launch-kawai-image-02
```

## 2. Testes com UTM manual

Use estes links para validar o tracking mesmo sem criar o link antes no admin:

```txt
http://localhost:3001/?utm_source=instagram&utm_medium=social&utm_campaign=lancamento-app&utm_content=video-01&influencer=maria.silva&platform=instagram-reels&creative=video-01&creative_type=video
http://localhost:3001/?utm_source=tiktok&utm_medium=social&utm_campaign=lancamento-app&utm_content=ugc-02&influencer=joao.santos&platform=tiktok-feed&creative=ugc-02&creative_type=video
http://localhost:3001/?utm_source=facebook&utm_medium=cpc&utm_campaign=teste-campanha-meta&utm_term=lookalike&utm_content=imagem-03&platform=facebook-ads&creative=imagem-03&creative_type=image
http://localhost:3001/?utm_source=google&utm_medium=cpc&utm_campaign=brand-search&utm_term=nome-do-app&utm_content=search-ad-01&platform=google-search&creative=search-ad-01&creative_type=text
http://localhost:3001/?utm_source=youtube&utm_medium=video&utm_campaign=pre-roll-lancamento&utm_content=video-05&influencer=canal-tech&platform=youtube-pre-roll&creative=video-05&creative_type=video
```

## 3. Testes de origem direta e orgânica

```txt
http://localhost:3001/?utm_source=direct&utm_medium=none&utm_campaign=acesso-direto
http://localhost:3001/?utm_source=organic&utm_medium=seo&utm_campaign=blog-post
http://localhost:3001/?utm_source=whatsapp&utm_medium=share&utm_campaign=grupo-vip
```

## 4. URLs para inspeção no admin

```txt
http://localhost:3001/login
http://localhost:3001/admin
http://localhost:3001/admin/utm
```

## 5. Fluxo sugerido de teste

1. Abra uma URL desta lista em aba anônima.
2. Aguarde a landing carregar por completo.
3. Clique em `Apple Store` ou `Play Store`.
4. Entre no admin e confira se a visita e o clique apareceram no aggregate ou no modo realtime.

## 6. Observações

- Os links de `Apple Store` e `Play Store` usam as variáveis `NEXT_PUBLIC_APP_STORE_URL` e `NEXT_PUBLIC_PLAY_STORE_URL`.
- Se você criar links no admin com `landingPath` diferente de `/`, a URL pública real seguirá o formato:

```txt
http://localhost:3001/sua-rota?ref=seu-slug
```
