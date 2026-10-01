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
    load: "Load tasks",
  },
  tasks: {
    heading: "Tasks",
    emptyIdle: "Load the register to see your tasks.",
    empty: "No tasks yet.",
  },
  errors: {
    network: "Could not reach the server. Check that the API is running.",
    notFound: "This task no longer exists. Reload the list.",
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
