import { Entity, PrimaryColumn, Index } from 'typeorm';

@Entity()
export class Favorite {
    @PrimaryColumn()
    @Index() 
    name: string;
}