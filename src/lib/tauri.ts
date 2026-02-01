import { invoke } from "@tauri-apps/api/core";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";
import type { Source, CreateSourceRequest, UpdateSourceRequest } from "@/types/source";

export const api = {
  creators: {
    getAll: () => invoke<Creator[]>("get_creators"),
    get: (id: string) => invoke<Creator>("get_creator", { id }),
    create: (request: CreateCreatorRequest) => invoke<Creator>("create_creator", { request }),
    update: (id: string, request: UpdateCreatorRequest) => invoke<Creator>("update_creator", { id, request }),
    delete: (id: string) => invoke<void>("delete_creator", { id }),
  },
  sources: {
    getByCreator: (creatorId: string) => invoke<Source[]>("get_sources_by_creator", { creatorId }),
    create: (request: CreateSourceRequest) => invoke<Source>("create_source", { request }),
    update: (id: string, request: UpdateSourceRequest) => invoke<Source>("update_source", { id, request }),
    delete: (id: string) => invoke<void>("delete_source", { id }),
  },
};
