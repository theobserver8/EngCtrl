// Source of truth for the message shape: every other locale is typed against it.
export const en = {
  meta: {
    documentTitle: "Task register · CEMOSA",
  },
  header: {
    overline: "CEMOSA · Engineering & Control",
    title: "Task register",
    subtitle: "Track every item until it passes inspection.",
  },
  titleBlock: {
    date: "Date",
    total: "Total",
    done: "Done",
    open: "Open",
  },
  language: {
    label: "Language",
  },
  form: {
    label: "New task",
    placeholder: "Describe the next item to inspect…",
    submit: "Add",
  },
  actions: {
    retry: "Retry",
    dismiss: "Dismiss message",
  },
  tasks: {
    heading: "Tasks",
    loading: "Loading tasks…",
    syncing: "Syncing",
    empty: "No tasks yet. Add the first one above.",
    delete: (title: string) => `Delete task: ${title}`,
    confirmDelete: (title: string) => `Confirm deletion of task: ${title}`,
    confirmDeleteShort: "Delete?",
  },
  announcements: {
    added: (title: string) => `Task added: ${title}`,
    deleted: (title: string) => `Task deleted: ${title}`,
  },
  errors: {
    network: "Could not reach the server. Check that the API is running.",
    notFound: "This task no longer exists. The list has been updated.",
    validation: "The data sent is not valid.",
    server: "The server could not complete the request.",
    generic: "Something went wrong. Please try again.",
  },
  footer: {
    project: "Technical test · FastAPI + React",
    revision: "Rev. 01",
  },
};

export type Messages = typeof en;
