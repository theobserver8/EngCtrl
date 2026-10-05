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
  progress: {
    label: "Completion",
    value: (percent: number) => `${percent}% of tasks completed`,
  },
  language: {
    label: "Language",
  },
  form: {
    label: "New task",
    placeholder: "Describe the next item to inspect…",
    submit: "Add",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Optional details: location, element, reference…",
    descriptionAdd: "Add description",
    descriptionRemove: "Remove description",
    submitHint: "Ctrl + Enter to add",
  },
  actions: {
    retry: "Retry",
    dismiss: "Dismiss message",
  },
  tasks: {
    heading: "Tasks",
    views: "Task views",
    favoritesHeading: "Favourites",
    trashHeading: "Trash",
    favorite: (title: string) => `Mark as favourite: ${title}`,
    unfavorite: (title: string) => `Remove from favourites: ${title}`,
    loading: "Loading tasks…",
    syncing: "Syncing",
    empty: "No tasks yet. Add the first one above.",
    unavailable: "The register could not be loaded.",
    trash: (title: string) => `Move to the trash: ${title}`,
    restore: (title: string) => `Restore from the trash: ${title}`,
  },
  announcements: {
    added: (title: string) => `Task added: ${title}`,
    trashed: (title: string) => `Moved to the trash: ${title}`,
    restored: (title: string) => `Restored from the trash: ${title}`,
    favorited: (title: string) => `Added to favourites: ${title}`,
    unfavorited: (title: string) => `Removed from favourites: ${title}`,
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
