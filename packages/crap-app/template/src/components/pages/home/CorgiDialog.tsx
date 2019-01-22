import ModalDialog from "../../ModalDialog";
import React,{lazy} from "react";

const CorgiInfo = lazy(() => import(/* webpackPreload: true */ './CorgiInfo'));

export default props => <ModalDialog title="Pembroke Welsh Corgi" {...props}><CorgiInfo/></ModalDialog>