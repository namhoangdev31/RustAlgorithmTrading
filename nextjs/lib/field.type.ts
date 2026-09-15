import type { BaseFieldProps } from "ra-core";
import type { ReactNode } from "react";

export interface FieldProps<
  
  RecordType extends Record<string, any> = Record<string, any>,
> extends Omit<BaseFieldProps<RecordType>, "resource"> {
  
  empty?: ReactNode;
}
