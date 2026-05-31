declare module "*.css";
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}

// Razorpay checkout.js — loaded dynamically from checkout.razorpay.com/v1/checkout.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Window { Razorpay: any; }
