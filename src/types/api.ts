export interface Envelope<T> {
  data: T;
}

export interface SignedUrl {
  url: string;
  expiresIn: number;
}

export interface UploadableFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
}
