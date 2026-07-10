# 🤖 PROMPT ANALÍTICO — Nuestra Historia

**Cómo usarlo:**
1. Copia TODO el prompt de abajo (desde "ERES UN ANALISTA..." hasta el final).
2. Pégalo en Claude, ChatGPT u otra IA con capacidad de archivos largos.
3. Adjunta el `.txt` exportado de WhatsApp (o pega su contenido).
4. Reemplaza los 3 datos entre `[corchetes]` al inicio.
5. Guarda la respuesta de la IA como archivo `.json` (o `.txt`) y súbelo en el formulario de Nuestra Historia.

---

```
ERES UN ANALISTA EXPERTO DE CONVERSACIONES DE PAREJA.

Recibirás el archivo .txt exportado de un chat de WhatsApp entre dos personas.
Tu misión: analizarlo COMPLETO con comprensión contextual y devolver ÚNICAMENTE
un objeto JSON con las estadísticas exactas, siguiendo el schema del final.

DATOS DE ENTRADA:
- Nombre de él (como aparece en el chat): [NOMBRE_EL]
- Nombre de ella (como aparece en el chat): [NOMBRE_ELLA]
- Fecha de inicio de la relación: [YYYY-MM-DD]

══════════════════════════════════════════
REGLAS DE ANÁLISIS CONTEXTUAL (críticas)
══════════════════════════════════════════

1. IGNORA por completo (no cuentan como mensajes de la pareja):
   - Mensajes de sistema de WhatsApp (cifrado, llamadas perdidas, "se eliminó este mensaje").
   - "<Multimedia omitido>", stickers, audios, etc. (sí cuentan para el total de
     mensajes, pero no para análisis de texto).

2. CONTENIDO NO ROMÁNTICO — usa tu criterio contextual:
   - Para "mensajeMasLargo" elige el mensaje largo MÁS SIGNIFICATIVO PARA LA RELACIÓN
     (una declaración, una disculpa sentida, una carta). EXCLUYE mensajes largos que
     sean contenido técnico, laboral o copiado: prompts de IA, código, XML/JSON,
     listas de trabajo, cadenas reenviadas, publicidad, tareas, apuntes de estudio.
   - Igual criterio para "mensajeMasCorto": debe ser tierno o significativo
     (ej: "❤️", "tqm"), no un "ok" operativo.

3. EXPRESIONES DE AMOR — conteo flexible pero sin falsos positivos:
   - Cuenta: "te amo", "te quiero", "tqm", "tkm", "tam", "te adoro", "mi amor",
     "mi vida", "mi cielo", apodos cariñosos propios de la pareja que detectes,
     variantes con letras repetidas ("te amooo"), con o sin tildes.
   - NO cuentes palabras dentro de otras (ej: "tam" dentro de "también",
     "te a" dentro de "te aviso").
   - Detecta también expresiones cariñosas ÚNICAS de esta pareja (apodos que se
     repiten) e inclúyelas en "palabrasMasCarinosas".

4. CONFLICTOS — solo tensiones reales:
   - Un conflicto = intercambio con enojo/dolor genuino seguido de distanciamiento
     (horas sin hablar) y luego reconciliación.
   - NO cuentes bromas, sarcasmo cariñoso, quejas del trabajo o "me enojé" en tono juguetón.
   - Trata este dato con delicadeza: es para una sección tierna sobre resiliencia.

5. PRECISIÓN NUMÉRICA:
   - Cuenta mensajes REALES (una entrada con timestamp = 1 mensaje; las líneas de
     continuación pertenecen al mensaje anterior).
   - "actividadPorHora": array de 24 enteros (índice 0 = 00:00-00:59 ... 23 = 23:00-23:59).
   - "diaSemanaTop": 0=domingo, 1=lunes ... 6=sábado.
   - Porcentajes enteros que sumen 100.
   - Fechas: "YYYY-MM-DD" para días, "YYYY-MM" para meses, ISO 8601 completo
     ("YYYY-MM-DDTHH:mm:ss") para timestamps de mensajes.
   - "velocidadRespuesta": minutos promedio en responder cuando cambia el autor
     (ignora gaps mayores a 12 horas). Un decimal.
   - "frecuenciaPromedioDias": días promedio entre expresiones de amor (puede ser
     decimal menor a 1 si se lo dicen varias veces al día).

6. MOMENTOS DE LA PAREJA (sección "momentos") — la parte más valiosa:
   Lee el chat como un biógrafo cariñoso y extrae historias reales rastreables:

   a) ANÉCDOTAS (6 a 12): momentos graciosos, tiernos o cómplices con fecha,
      título corto y una narración de 2-3 frases ESCRITA PARA ELLA (segunda
      persona o "ustedes", tono cálido, nunca estilo reporte).
      Ejemplos del tipo de cosas a buscar: bromas que se volvieron código
      interno, sorpresas, confesiones divertidas, meteduras de pata adorables,
      gestos de confianza (ej: "le puso su huella al celular"), reacciones
      curiosas ante eventos (temblores, partidos, comidas), comentarios de
      familiares sobre la pareja, canciones dedicadas, celos juguetones.
      Clasifica cada una con "tipo":
        - "romantico": declaraciones, gestos tiernos, dedicatorias
        - "gracioso": anécdotas que dan risa, bromas, situaciones absurdas
        - "complice": jueguecitos internos, indirectas pícaras, códigos secretos
          (SIN citas explícitas de contenido íntimo — solo alusión elegante y sugerente)

   b) SALIDAS/CITAS (hasta 6): encuentros presenciales rastreables en el chat
      (menciones en tiempo real tipo "estamos en...", planes confirmados +
      comentarios posteriores). Fecha + título + descripción de 1-2 frases.

   c) APODOS: los apodos reales que se dicen, con quién lo usa ("el", "ella",
      "ambos") y frecuencia aproximada. Prioriza los ÚNICOS de esta pareja.

   d) CANCIÓN: si detectas "nuestra canción" o dedicatorias, indica título si
      es identificable y la evidencia textual breve. Si no, null.

   e) PRIMERA CITA: si hay evidencia del primer encuentro presencial, descríbelo
      con fecha y marca "confianza": "alta" | "media" | "baja".

   f) FRASE QUE LOS DEFINE: una cita textual corta y hermosa de alguno de los
     dos que resuma su relación (ej: "me salvas cuando ando en un caos").

7. EXTRACTOS DE TEXTO (privacidad):
   - Incluye texto SOLO en: primerMensaje, primeraExpresion, mensajeMasLargo
     (máx. 400 caracteres), mensajeMasCorto, y la sección "momentos"
     (narraciones y frase que los define). Nada de contenido íntimo explícito.

══════════════════════════════════════════
FORMATO DE SALIDA (obligatorio)
══════════════════════════════════════════

Responde ÚNICAMENTE con el JSON (sin explicaciones, sin markdown, sin ```).
Usa exactamente estas claves:

{
  "version": 1,
  "fuente": "ia",
  "general": {
    "totalMensajes": 0,
    "diasDesdeInicio": 0,
    "diasHablaron": 0,
    "diasSinHablar": 0,
    "promedioMensajesDiario": 0,
    "primerMensaje": { "fecha": "YYYY-MM-DDTHH:mm:ss", "autor": "", "esEl": true, "texto": "" },
    "diaConMasMensajes": { "fecha": "YYYY-MM-DD", "cantidad": 0 },
    "porPersona": {
      "el":   { "total": 0, "porcentaje": 0, "promedioDiario": 0 },
      "ella": { "total": 0, "porcentaje": 0, "promedioDiario": 0 }
    }
  },
  "amor": {
    "totalExpresionesAmor": 0,
    "porPersona": {
      "el":   { "total": 0, "porcentaje": 0 },
      "ella": { "total": 0, "porcentaje": 0 }
    },
    "primeraExpresion": { "fecha": "YYYY-MM-DDTHH:mm:ss", "autor": "", "esEl": true, "texto": "" },
    "frecuenciaPromedioDias": 0,
    "mesMasRomantico": "YYYY-MM",
    "palabrasMasCarinosas": [ { "palabra": "", "count": 0 } ]
  },
  "ritmo": {
    "rachaMasLarga": 0,
    "rachaMasLargaInicio": "YYYY-MM-DD",
    "rachaSinHablar": 0,
    "horaPico": 0,
    "actividadPorHora": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "diaSemanaTop": 0,
    "quienEscribePrimero": "el | ella | empate",
    "porcentajePrimeroEl": 0,
    "porcentajePrimeroElla": 0,
    "velocidadRespuestaEl": 0,
    "velocidadRespuestaElla": 0
  },
  "conflictos": {
    "totalDetectados": 0,
    "tiempoPromedioRecuperacion": null,
    "mesConMenosConflictos": "YYYY-MM",
    "mesConMasConflictos": null,
    "conflictos": []
  },
  "curiosidades": {
    "mensajesMadrugada": 0,
    "mensajeMasLargo": { "autor": "", "esEl": true, "texto": "", "longitud": 0, "fecha": "YYYY-MM-DDTHH:mm:ss" },
    "mensajeMasCorto": { "autor": "", "esEl": false, "texto": "", "longitud": 0, "fecha": "YYYY-MM-DDTHH:mm:ss" },
    "emojiMasUsadoEl":   { "emoji": "", "count": 0 },
    "emojiMasUsadoElla": { "emoji": "", "count": 0 },
    "palabrasMasUsadas": [ { "palabra": "", "count": 0 } ],
    "totalEmojis": 0,
    "semanaConMasActividad": { "inicio": "YYYY-MM-DD", "mensajes": 0 }
  },
  "momentos": {
    "anecdotas": [
      { "fecha": "YYYY-MM-DD", "titulo": "", "descripcion": "", "tipo": "romantico | gracioso | complice" }
    ],
    "salidas": [
      { "fecha": "YYYY-MM-DD", "titulo": "", "descripcion": "" }
    ],
    "apodos": [
      { "apodo": "", "quien": "el | ella | ambos", "count": 0 }
    ],
    "cancion": { "titulo": null, "evidencia": "" },
    "primeraCita": { "fecha": "YYYY-MM-DD", "descripcion": "", "confianza": "alta | media | baja" },
    "fraseQueLosDefine": ""
  }
}

Notas finales:
- "palabrasMasCarinosas": top 5-10, ordenadas por count descendente.
- "palabrasMasUsadas": top 20 palabras significativas (sin artículos, conectores ni risas).
- "momentos.anecdotas": incluye variedad de los 3 tipos (la página filtrará según el
  tono que elija el creador: romántico, divertido o todos).
- Si un dato no existe (ej: nunca hubo conflictos, no hay primera cita clara),
  usa null o array vacío según el schema.
- Verifica que el JSON sea válido (sin comas colgantes) antes de responder.
```
