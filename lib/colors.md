# Sistema de Cores

Este documento explica como usar o sistema de cores padrão do projeto.

## Formas de Usar

### 1. Importando o objeto de cores (JavaScript/React)

```javascript
import colors from "../../lib/colors"

// Usar em estilos inline
<div style={{ color: colors.primary[500] }}>
  Texto azul
</div>

// Usar em styled-jsx
<style jsx>{`
  .minha-classe {
    color: ${colors.primary[500]};
    background: ${colors.background.secondary};
  }
`}</style>
```

### 2. Usando variáveis CSS

As variáveis CSS estão disponíveis globalmente após importar `styles/globals.css`:

```css
.minha-classe {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
}
```

```jsx
<div
  style={{
    color: "var(--color-primary)",
    backgroundColor: "var(--color-bg-secondary)",
  }}
>
  Conteúdo
</div>
```

## Paleta de Cores

### Cores Primárias

- `colors.primary[500]` ou `var(--color-primary)` - Azul principal (#0070f3)
- Tons de 50 a 900 disponíveis para diferentes intensidades

### Cores de Estado

- **Sucesso**: `colors.success[500]` ou `var(--color-success)`
- **Erro**: `colors.error[500]` ou `var(--color-error)`
- **Aviso**: `colors.warning[500]` ou `var(--color-warning)`
- **Info**: `colors.info[500]` ou `var(--color-info)`

### Cores Neutras

- `colors.gray[50]` a `colors.gray[900]` - Escala de cinzas
- `colors.text.primary` - Texto principal
- `colors.text.secondary` - Texto secundário
- `colors.background.primary` - Fundo principal

## Exemplos de Uso

### Botão Primário

```jsx
<button
  style={{
    backgroundColor: colors.primary[500],
    color: colors.text.inverse,
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
  }}
>
  Clique aqui
</button>
```

### Mensagem de Erro

```jsx
<div
  style={{
    backgroundColor: colors.error[50],
    color: colors.error[700],
    border: `1px solid ${colors.error[200]}`,
    padding: "1rem",
    borderRadius: "4px",
  }}
>
  Erro ao processar
</div>
```

### Card com Borda

```jsx
<div
  style={{
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.default}`,
    padding: "1.5rem",
    borderRadius: "8px",
  }}
>
  Conteúdo do card
</div>
```

## Boas Práticas

1. **Sempre use as cores do sistema** - Evite valores hardcoded como `#0070f3`
2. **Use variáveis CSS quando possível** - Melhor performance e suporte a temas
3. **Mantenha consistência** - Use as mesmas cores para os mesmos propósitos
4. **Respeite a hierarquia** - Use `primary[500]` para ações principais, tons mais claros para backgrounds
