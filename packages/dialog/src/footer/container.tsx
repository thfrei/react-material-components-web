import * as React from "react";

import {
    ClassNamePropMakerAdapter,
    createDefaultComponent,
    DefaultComponent,
    PropMakerMetaComponent,
} from "@react-mdc/base";

import {
  BASE_CLASS_NAME,
} from "./constants";

export const CLASS_NAME = BASE_CLASS_NAME;

export type MetaProps = {
};

export type ChildProps = {
    className?: string,
};

/**
 * Footer component
 */
export class PropMaker extends ClassNamePropMakerAdapter<ChildProps, MetaProps, {}> {
    protected getBaseClassName() {
        return CLASS_NAME;
    }
}

export type Props = React.HTMLProps<HTMLElement> & MetaProps;

export default createDefaultComponent<React.HTMLProps<HTMLElement>, MetaProps>(
    "footer",
    PropMakerMetaComponent.simple(new PropMaker(), "Container"),
    [],
);
