import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function uploadToImageKit(file: any, fileName: string) {
  const response = await imagekit.upload({
    file: file.buffer.toString("base64"), // required format
    fileName: fileName,
  });

  return {
    fileId: response.fileId,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl,
  };
}