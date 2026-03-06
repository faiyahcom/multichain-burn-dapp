import { Buffer } from "buffer";
import process from "process";

// Make them global (browser)
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process;
}
