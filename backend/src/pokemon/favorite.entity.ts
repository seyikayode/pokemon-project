import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Favorite {
    @PrimaryColumn()
    name: string;
}