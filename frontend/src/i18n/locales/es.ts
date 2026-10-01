import type { Messages } from "./en";

// Typed against the English messages: a missing or unknown key is a compile error.
export const es: Messages = {
  meta: {
    documentTitle: "Registro de tareas · CEMOSA",
  },
  header: {
    overline: "CEMOSA · Ingeniería y Control",
    title: "Registro de tareas",
    subtitle: "Controla cada tarea hasta que supere la inspección.",
  },
  titleBlock: {
    date: "Fecha",
    total: "Total",
    done: "Hechas",
    open: "Abiertas",
  },
  language: {
    label: "Idioma",
  },
  form: {
    label: "Nueva tarea",
    placeholder: "Describe la próxima tarea a revisar…",
    submit: "Añadir",
  },
  actions: {
    load: "Cargar tareas",
  },
  tasks: {
    heading: "Tareas",
    emptyIdle: "Carga el registro para ver tus tareas.",
    empty: "Todavía no hay tareas.",
  },
  errors: {
    network: "No se ha podido conectar con el servidor. Comprueba que la API está en marcha.",
    notFound: "Esta tarea ya no existe. Recarga la lista.",
    validation: "Los datos enviados no son válidos.",
    server: "El servidor no ha podido completar la petición.",
    generic: "Algo ha fallado. Inténtalo de nuevo.",
  },
  footer: {
    project: "Prueba técnica · FastAPI + React",
    revision: "Rev. 01",
  },
};
