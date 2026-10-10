"use client";

import type * as React from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const Drawer = Sheet;
const DrawerTrigger = SheetTrigger;
const DrawerClose = SheetClose;
const DrawerHeader = SheetHeader;
const DrawerTitle = SheetTitle;
const DrawerDescription = SheetDescription;

function DrawerContent({
  className,
  ...props
}: Omit<React.ComponentProps<typeof SheetContent>, "side">) {
  return (
    <SheetContent
      side="bottom"
      className={`max-h-[85vh] rounded-t-3xl ${className ?? ""}`}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
