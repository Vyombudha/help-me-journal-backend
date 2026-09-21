import { Entry } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";

const createEntry = async (
  ownerId: string,
  containerId: string,
  title: string,
  content: string,
): Promise<Entry> => {
  await prisma.container.findFirstOrThrow({
    where: {
      id: containerId,
      project: {
        ownerId,
      },
    },
  });

  const lastEntry = await prisma.entry.findFirst({
    where: {
      containerId,
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  return await prisma.entry.create({
    data: {
      title,
      content,
      containerId,
      order: (lastEntry?.order ?? -1) + 1,
    },
  });
};

const getAllEntries = async (
  ownerId: string,
  containerId: string,
): Promise<Entry[]> => {
  await prisma.container.findFirstOrThrow({
    where: {
      id: containerId,
      project: {
        ownerId,
      },
    },
  });
  const entries = await prisma.entry.findMany({
    where: {
      containerId,
    },
    orderBy: {
      order: "asc",
    },
  });

  return entries;
};

const getEntry = async (ownerId: string, entryId: string): Promise<Entry> => {
  return await prisma.entry.findFirstOrThrow({
    where: {
      id: entryId,
      container: {
        project: {
          ownerId,
        },
      },
    },
  });
};

const updateEntryData = async (
  ownerId: string,
  entryId: string,
  newTitle: string | undefined,
  newContent: string | undefined,
): Promise<Entry> => {
  if ((newTitle && newContent) || (!newTitle && !newContent)) {
    return await prisma.entry.update({
      data: {
        title: newTitle,
        content: newContent,
      },
      where: {
        id: entryId,
        container: {
          project: {
            ownerId,
          },
        },
      },
    });
  } else if (!newTitle && newContent) {
    return await prisma.entry.update({
      data: {
        content: newContent,
      },
      where: {
        id: entryId,
        container: {
          project: {
            ownerId,
          },
        },
      },
    });
  } else {
    return await prisma.entry.update({
      data: {
        title: newTitle,
      },
      where: {
        id: entryId,
        container: {
          project: {
            ownerId,
          },
        },
      },
    });
  }
};

const deleteEntry = async (ownerId: string, entryId: string): Promise<void> => {
  await prisma.entry.delete({
    where: {
      id: entryId,
      container: {
        project: {
          ownerId,
        },
      },
    },
  });
};

const EntryService = {
  get: getEntry,
  new: createEntry,
  getAll: getAllEntries,
  updateData: updateEntryData,
  delete: deleteEntry,
};

export default EntryService;
