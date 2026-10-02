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
  progress: {
    label: "Progreso",
    value: (percent) => `${percent} % de las tareas completadas`,
  },
  language: {
    label: "Idioma",
  },
  form: {
    label: "Nueva tarea",
    placeholder: "Describe la próxima tarea a revisar…",
    submit: "Añadir",
    descriptionLabel: "Descripción",
    descriptionPlaceholder: "Detalles opcionales: ubicación, elemento, referencia…",
    descriptionAdd: "Añadir descripción",
    descriptionRemove: "Quitar descripción",
    submitHint: "Ctrl + Enter para añadir",
  },
  actions: {
    retry: "Reintentar",
    dismiss: "Cerrar aviso",
  },
  tasks: {
    heading: "Tareas",
    favoritesHeading: "Favoritas",
    favoritesEmpty: "Marca una tarea con la estrella para tenerla a mano.",
    allFavorites: "Todas tus tareas están en favoritas.",
    favorite: (title) => `Marcar como favorita: ${title}`,
    unfavorite: (title) => `Quitar de favoritas: ${title}`,
    loading: "Cargando tareas…",
    syncing: "Sincronizando",
    empty: "Todavía no hay tareas. Añade la primera arriba.",
    unavailable: "No se ha podido cargar el registro.",
    delete: (title) => `Eliminar tarea: ${title}`,
    confirmDelete: (title) => `Confirmar eliminación de la tarea: ${title}`,
    cancelDelete: (title) => `Cancelar eliminación de la tarea: ${title}`,
    confirmDeleteShort: "¿Borrar?",
  },
  announcements: {
    added: (title) => `Tarea añadida: ${title}`,
    deleted: (title) => `Tarea eliminada: ${title}`,
    favorited: (title) => `Añadida a favoritas: ${title}`,
    unfavorited: (title) => `Quitada de favoritas: ${title}`,
  },
  errors: {
    network: "No se ha podido conectar con el servidor. Comprueba que la API está en marcha.",
    notFound: "Esta tarea ya no existe. La lista se ha actualizado.",
    validation: "Los datos enviados no son válidos.",
    server: "El servidor no ha podido completar la petición.",
    generic: "Algo ha fallado. Inténtalo de nuevo.",
  },
  footer: {
    project: "Prueba técnica · FastAPI + React",
    revision: "Rev. 01",
  },
};
