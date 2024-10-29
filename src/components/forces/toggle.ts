export default class Toggle<T> {
    id: keyof T;
    label: string;
    value: boolean;
    description: string;

    constructor(id: keyof T, label: string, value: boolean, description: string) {
        this.id = id;
        this.label = label;
        this.value = value;
        this.description = description;
    }
}