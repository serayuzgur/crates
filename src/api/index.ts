/**
 * Holds important api calls for the crates.io.
 */
import { get } from "request-promise";

const API = "https://crates.io/api/v1";

export const crates = (name: string) => get(`${API}/crates`);
export const crate = (name: string) => get(`${API}/crates/${name}`);
export const version = (name: string) => get(`${API}/crates/${name}/${version}`);
export const versionDownload = (name: string,version:string) => get(`${API}/crates/${name}/${version}/download`);
export const versionDependencies = (name: string,version:string) => get(`${API}/crates/${name}/${version}/dependencies`);
export const versionDownloads = (name: string,version:string) => get(`${API}/crates/${name}/${version}/downloads`);
export const versionAuthors = (name: string,version:string) => get(`${API}/crates/${name}/${version}/authors`);
export const downloads = (name: string) => get(`${API}/crates/${name}/downloads`);
export const versions = (name: string) => get(`${API}/crates/${name}/versions`);
export const following = (name: string) => get(`${API}/crates/${name}/following`);
export const owners = (name: string) => get(`${API}/crates/${name}/owners`);
export const reverseDependencies = (name: string) => get(`${API}/crates/${name}/reverse_dependencies`);
export const keywords = (name: string) => get(`${API}/keywords`);
export const keyword = (keywordId: string) => get(`${API}/keywords/${keywordId}`);
