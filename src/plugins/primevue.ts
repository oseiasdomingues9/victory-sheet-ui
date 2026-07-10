import "primeicons/primeicons.css";

import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Password from 'primevue/password';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import ProgressBar from 'primevue/progressbar';
import InputNumber from 'primevue/inputnumber';
import Avatar from 'primevue/avatar';
import Image from 'primevue/image'



import Tooltip from "primevue/tooltip";

import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';



export const primevue = {
  install(app: any) {
    app.component('Button', Button);
    app.component('Checkbox', Checkbox);
    app.component('DatePicker', DatePicker);
    app.component('InputText', InputText);
    app.component('Paginator', Paginator);
    app.component('Password', Password); 
    app.component('Tag', Tag);
    app.component('ProgressSpinner', ProgressSpinner);
    app.component('Select', Select);
    app.component('ConfirmDialog', ConfirmDialog);
    app.component('Toast', Toast);
    app.component('ProgressBar', ProgressBar);
    app.component('InputNumber', InputNumber);
    app.component('Avatar', Avatar);
    app.component('Image', Image);


    app.directive('tooltip', Tooltip);

    app.use(ToastService);
    app.use(DialogService);
    app.use(ConfirmationService);
  }
}