import ModalDialog, {Props} from "../../ModalDialog";
import React,{lazy} from "react";

const CorgiInfo = lazy(() => import(/* webpackPreload: true */ './CorgiInfo'));

export default (props: Omit<Props,'title'|'children'>) => <ModalDialog title="Pembroke Welsh Corgi" {...props}><CorgiInfo/></ModalDialog>