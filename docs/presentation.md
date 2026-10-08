# EpiSafe AI — Guion para la presentación

## Diapositiva 1 — EpiSafe AI

**Sistema inteligente de prevención y acompañamiento para personas con epilepsia**

Una herramienta de autocuidado que conecta el registro diario, la observación de patrones y una red personal de apoyo.

## Diapositiva 2 — Un problema de la vida real

- Algunas personas olvidan registrar factores cotidianos que pueden ser relevantes para su seguimiento.
- Puede ser difícil reconocer patrones personales de sueño, estrés, cafeína o adherencia al tratamiento.
- La información no siempre está fácilmente disponible para el equipo de salud o la red de apoyo.
- Una aplicación puede ayudar a organizar información, pero no debe sustituir la atención médica.

## Diapositiva 3 — Nuestra propuesta

- Registro diario de horas de sueño, estrés, cafeína, ejercicio y medicamento reportado.
- Historial de eventos con fecha, duración y notas personales.
- Índice de bienestar ilustrativo que explica qué datos registrados influyen en su cálculo.
- Análisis de asociaciones personales con tamaño de muestra y advertencia de correlación.
- Círculo de confianza con notificaciones por correo opcionales.
- Exportación del historial para facilitar una conversación con el equipo de salud.

## Diapositiva 4 — ¿Dónde está la IA?

EpiSafe incorpora un modelo experimental de **regresión logística personalizada**, implementado en TypeScript y ejecutado localmente en el navegador. Aprende asociaciones entre cuatro factores registrados (sueño corto, medicamento omitido, estrés elevado y cafeína) y días con eventos registrados. Utiliza hasta 90 días de check-ins y regularización para limitar el ajuste excesivo. Además, EpiSafe Guide usa **SmolLM2 135M Instruct**, un modelo de lenguaje ejecutado en el navegador con Transformers.js y ONNX Runtime.

El modelo predictivo solo se activa después de contar con al menos 30 check-ins anteriores, 5 días con eventos y 15 días sin eventos registrados. Antes de alcanzar ese umbral, la interfaz utiliza reglas iniciales transparentes. El modelo excluye el check-in de hoy durante el entrenamiento y presenta los factores observados para que el resultado sea explicable. El chat de SmolLM2 se ejecuta en el dispositivo: no necesita API key ni envía la conversación a un servicio de inferencia. La primera vez se descargan y se guardan en caché cerca de 120 MB de archivos del modelo desde Hugging Face. La memoria del chat se conserva en el navegador.

El puntaje de 0 a 100 es una señal experimental de asociación, **no una probabilidad, pronóstico ni predicción clínica**. No se envían datos a un proveedor de IA. Los registros de la beta son locales y los ejemplos precargados son ficticios. El modelo no está validado clínicamente; no diagnostica, modifica dosis ni recomienda tratamientos.

## Diapositiva 5 — Estructuras de datos aplicadas

| Estructura | Aplicación en EpiSafe |
|---|---|
| Hash map | Agrupar eventos por día y factor |
| Lista doblemente enlazada | Recorrer el historial diario en orden |
| Pila | Presentar los eventos más recientes primero |
| Árbol binario de búsqueda | Indexar días con eventos y ordenarlos |
| Cola | Recorrido por niveles de la red de apoyo |
| Grafo | Representar conexiones entre el usuario y sus contactos |
| Cola de prioridad / heap | Ordenar contactos según prioridad configurada |

## Diapositiva 6 — Arquitectura

**Frontend:** React + TypeScript + Vite, desplegado en Netlify.  
**API/backend:** Netlify Functions en TypeScript.  
**Autenticación y datos:** Supabase Auth + PostgreSQL en la nube.  
**Seguridad:** claves de servidor privadas, consultas con alcance por usuario y Row Level Security.  
**Notificaciones:** Resend opcional, integrado desde funciones de backend.
**Asistente conversacional:** SmolLM2 135M Instruct, ejecutado localmente con Transformers.js y ONNX Runtime usando CPU/WASM en un Web Worker del navegador; no requiere API key ni inferencia en la nube.

Todo el código y las funciones de la aplicación se escriben en TypeScript.

## Diapositiva 7 — Privacidad y seguridad

- Cada usuario inicia sesión para acceder a sus datos en la nube.
- Las tablas tienen políticas de Row Level Security.
- La clave de servicio de Supabase se guarda únicamente en el servidor.
- Los correos de emergencia no incluyen detalles del evento.
- En modo demo, los datos se almacenan localmente en el navegador.
- El chat usa inferencia local; la conversación no se envía a un proveedor de IA. En el primer uso se descargan los archivos del modelo desde Hugging Face.
- La memoria conversacional del asistente se conserva en el navegador y se puede borrar desde la interfaz.
- Un correo puede fallar o demorarse; nunca sustituye una llamada a emergencias.

## Diapositiva 8 — Alcance y responsabilidad

EpiSafe es un prototipo educativo de seguimiento personal. No es un dispositivo médico, servicio de monitoreo ni sistema clínico validado. Sus patrones dependen de los datos ingresados, pueden ser incompletos y no prueban causalidad. Ante una emergencia, la persona debe usar su plan de atención y contactar los servicios locales de emergencia.

## Diapositiva 9 — Demostración sugerida

1. Mostrar el panel y explicar el indicador transparente.
2. Guardar un registro diario con sueño, estrés y medicación.
3. Abrir el análisis de patrones y señalar el tamaño de muestra.
4. Agregar un contacto de prueba a la red de apoyo.
5. Registrar un evento ficticio y verificar el historial.
6. Exportar el historial en formato CSV.

Usar únicamente información ficticia durante la exposición.

## Diapositiva 10 — Cierre

**EpiSafe no sustituye al equipo de salud. Ayuda a que la persona tenga su información más organizada y pueda compartirla cuando lo decida.**

Próximos pasos: pruebas con usuarios y profesionales, consentimiento explícito, políticas de privacidad, evaluación de accesibilidad y revisión de los requisitos legales antes de cualquier uso clínico.
