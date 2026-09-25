// Metro görsel import'larını bir asset ID'sine (number) çevirir.
declare module '*.png' {
  const asset: number;
  export default asset;
}
