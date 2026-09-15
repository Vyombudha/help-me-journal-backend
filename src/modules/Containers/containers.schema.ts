import { z } from 'zod';
import { ContainerType, Mood } from '../../../generated/prisma/enums.js';


export const newContainerSchema = z.object({
    title: z.string().trim().min(1).max(100),
    type: z.enum(ContainerType),
    moods: z.array(z.enum(Mood))
});

export type newContainerInput = z.infer<typeof newContainerSchema>;



export const updateContainerSchema = z.object({
    newTitle: z.string().trim().min(1).max(100),
    newMoods: z.array(z.enum(Mood))
});


export type UpdateContainerInput = z.infer<typeof updateContainerSchema>;


export const containerIdParamSchema = z.object({
    containerId: z.uuid(),
});

export type ContainerIdParam = z.infer<typeof containerIdParamSchema>;