import type { Schemas } from "@app/contract";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "./api";

export type PublicConfig = Schemas["PublicConfig"];

export const fetchConfig = () => unwrap(api.GET("/api/config"));

export const useConfig = () =>
  useQuery({ queryKey: ["config"], queryFn: fetchConfig, staleTime: Number.POSITIVE_INFINITY });
