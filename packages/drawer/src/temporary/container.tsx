import * as React from "react";

import * as classNames from "classnames";
import * as PropTypes from "prop-types";

import { MDCTemporaryDrawerFoundation } from "@material/drawer/dist/mdc.drawer";
import {
    Map,
    OrderedSet,
    Set,
} from "immutable";

import {
    ClassNamePropMakerAdapter,
    createDefaultComponent,
    DefaultComponent,
    PropMakerMetaComponent,
} from "@react-mdc/base";
import { eventHandlerDecorator, includes } from "@react-mdc/base/lib/util";

import { ContainerAdapter, FoundationAdapter } from "./adapter";
import { BASE_CLASS_NAME } from "./constants";
import * as drawerUtil from "./drawerUtil";

export const CLASS_NAME = BASE_CLASS_NAME;

export type MetaProps = {
    open?: boolean,
    rtl?: boolean,
    style?: { [name: string]: any },
    onOpenDrawer?: (meta: Meta) => void,
    onCloseDrawer?: (meta: Meta) => void,
    onClick?: React.MouseEventHandler<any>,
};

export type ChildProps = {
    className?: string,
    onClick?: React.MouseEventHandler<any>,
};

export type State = {
    foundationClasses: Set<string>,
    foundationCssVars: Map<string, string | null>,
    foundationEventListeners: Map<string, Set<EventListener>>,
    open: boolean,
};

export type ChildContext = {
    adapter: FoundationAdapter,
};

const {
    cssClasses: {
        OPEN: OPEN_CLASS_NAME,
    },
    strings: {
        OPACITY_VAR_NAME,
    },
} = MDCTemporaryDrawerFoundation;

export class PropMaker extends ClassNamePropMakerAdapter<ChildProps, MetaProps, State> {
    public getClassName(_props: MetaProps, state: State): string {
        return classNames(
            CLASS_NAME,
            state.foundationClasses.toJS(),
        );
    }

    public makeNativeDOMProps(_c, _p, state: State) {
        return {
            cssVariables: state.foundationCssVars.toJS(),
            eventListeners: state.foundationEventListeners.toJS(),
        };
    }

    protected getBaseClassName() {
        return CLASS_NAME;
    }

    protected getClassValues(_c, props: MetaProps, state: State) {
        return [this.getClassName(props, state)];
    }

}

export class Meta extends PropMakerMetaComponent<ChildProps, MetaProps, State> {
    public static displayName = "Container";
    public static childContextTypes = {
        adapter: PropTypes.instanceOf(FoundationAdapter),
    };

    public static defaultProps = {
        rtl: false,
        style: {},
    };

    public state: State = {
        foundationClasses: OrderedSet<string>(),
        foundationCssVars: Map<string, string | null>(),
        foundationEventListeners: Map<string, Set<EventListener>>(),
        open: false,
    };

    public propMaker = new PropMaker();

    private adapter: FoundationAdapter;
    private foundation: MDCTemporaryDrawerFoundation;

    constructor(props) {
        super(props);
        this.adapter = new FoundationAdapter();
        this.foundation = new MDCTemporaryDrawerFoundation(this.adapter.toObject());
    }

    public getChildContext(): ChildContext {
        return {
            adapter: this.adapter,
        };
    }

    // Sync props and internal state
    public componentWillReceiveProps(props: MetaProps) {
        if (props.open !== this.state.open) {
            if (props.open) {
                this.foundation.open();
            } else {
                this.foundation.close();
            }
        }
    }

    // Foundation lifecycle
    public componentDidMount() {
        this.adapter.setContainerAdapter(new ContainerAdapterImpl(this));
        this.foundation.init();
    }

    public componentWillUnmount() {
        this.foundation.destroy();
        this.adapter.setContainerAdapter(new ContainerAdapter());
    }

    protected renderProps(childProps: ChildProps) {
        const {
            onClick,
        } = this.props;

        return {
            ...super.renderProps(childProps),
            onClick: (eventHandlerDecorator(this.handleClick)(onClick || null) as React.MouseEventHandler<any>),
        };
    }

    // Custom event handler
    private handleClick = (_evt: React.SyntheticEvent<any>) => {
        // Cannot handle properly click event because of react bug
        // We implement react event handler with same functionally of this one
        // https://github.com/material-components/material-components-web/issues/225
        // https://github.com/facebook/react/issues/8693
        this.foundation.close();
    }
}

class ContainerAdapterImpl extends ContainerAdapter {
    private element: Meta;

    constructor(element: Meta) {
        super();
        this.element = element;
    }
    public addClass(className: string) {
        this.element.setState((state) => ({
            foundationClasses: state.foundationClasses.add(className),
        }));

        // MDCTemporaryDrawerFoundation does not provide opening/closing event.
        // But we can assume open/close by adding/removing OPEN_CLASS_NAME
        if (className === OPEN_CLASS_NAME) {
            this.element.setState({
                open: true,
            });
            if (this.element.props.onOpenDrawer) {
                this.element.props.onOpenDrawer(this.element);
            }
        }
    }
    public removeClass(className: string) {
        this.element.setState((state) => ({
            foundationClasses: state.foundationClasses.remove(className),
        }));

        // MDCTemporaryDrawerFoundation does not provide opening/closing event.
        // But we can assume open/close by adding/removing OPEN_CLASS_NAME
        if (className === OPEN_CLASS_NAME) {
            this.element.setState({
                open: false,
            });
            if (this.element.props.onCloseDrawer) {
                this.element.props.onCloseDrawer(this.element);
            }
        }
    }
    public hasClass(className: string): boolean {
        return includes(
            this.element.propMaker.getClassName(this.element.props, this.element.state).split(/\s+/),
            className);
    }
    public registerInteractionHandler(evt: string, handler: EventListener) {
        // Don't use click event handler of MDCTemporaryDrawerFoundation
        // See `handleClick()` for more detail.
        if (evt === "click") {
            return;
        }
        this.element.setState((state) => ({
            foundationEventListeners: state.foundationEventListeners.update(
                drawerUtil.remapEvent(evt, window),
                OrderedSet<EventListener>(),
                (x) => x.add(handler),
            ),
        }));
    }
    public deregisterInteractionHandler(evt: string, handler: EventListener) {
        // Don't use click event handler of MDCTemporaryDrawerFoundation
        // See `handleClick()` for more detail.
        if (evt === "click") {
            return;
        }
        this.element.setState((state) => ({
            foundationEventListeners: state.foundationEventListeners.update(
                drawerUtil.remapEvent(evt, window),
                OrderedSet<EventListener>(),
                (x) => x.delete(handler),
            ),
        }));
    }
    public registerTransitionEndHandler(handler: EventListener) {
        const evt = "transitionend";
        this.registerInteractionHandler(evt, handler);
    }
    public deregisterTransitionEndHandler(handler: EventListener) {
        const evt = "transitionend";
        this.deregisterInteractionHandler(evt, handler);
    }
    public registerDocumentKeydownHandler(handler: EventListener) {
        document.addEventListener("keydown", handler);
    }
    public deregisterDocumentKeydownHandler(handler: EventListener) {
        document.removeEventListener("keydown", handler);
    }
    public updateCssVariable(value: string) {
        this.element.setState((state) => ({
            foundationCssVars: state.foundationCssVars.set(OPACITY_VAR_NAME, value),
        }));
    }
    public saveElementTabState(el: Element) {
        drawerUtil.saveElementTabState(el);
    }
    public restoreElementTabState(el: Element) {
        drawerUtil.restoreElementTabState(el);
    }
    public makeElementUntabbable(el: Element) {
        el.setAttribute("tabindex", "-1");
    }
    public isRtl(): boolean {
        return this.element.props.rtl || false;
    }
}

export default createDefaultComponent<React.HTMLProps<HTMLElement>, MetaProps>(
    "aside",
    Meta,
    [
        "open",
        "rtl",
        "style",
        "onOpenDrawer",
        "onCloseDrawer",
        "onClick",
    ],
);
