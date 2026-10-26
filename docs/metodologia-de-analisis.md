# Metodología del análisis

## Pronóstico de ventas
Modelo estacional por día de la semana con tendencia amortiguada:

1. Se calcula un factor por día de la semana (cuánto se desvía cada día del promedio).
2. Se desestacionaliza la serie y se ajusta una tendencia lineal sobre las últimas semanas, amortiguada para no extrapolar de más.
3. Cada día futuro = nivel × tendencia amortiguada × factor del día. El rango probable usa la dispersión de los residuos.

**Validación (backtest):** se reserva el final de la serie, se pronostica y se mide el error con **WAPE**. Se compara con un método ingenuo (repetir la semana anterior). La app muestra ambos porcentajes para que el usuario sepa cuánto confiar.

## Anomalías
Para cada día se estima el valor esperado con los mismos días de la semana de la ventana (56 días). Si el residuo supera 2,5 desviaciones robustas (MAD) y la diferencia es de al menos 28 %, se marca. Luego se atribuye al producto que más se alejó de su comportamiento normal ese día.

## Reglas por producto
Riesgo de agotarse (cobertura vs. tiempo de entrega), bajo el mínimo, baja rotación (capital inmovilizado), día pico, demanda al alza o a la baja y margen bajo. Los pedidos sugeridos cubren el plazo del proveedor más una semana de ventas.

## IA generativa
Solo redacta: recibe cifras ya calculadas y no puede inventarlas (el prompt exige usar únicamente el resumen). Si falla, la app sigue mostrando el análisis local.
