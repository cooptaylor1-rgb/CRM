import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column()
  symbol: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'current_price',
  })
  currentPrice: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'market_value',
  })
  marketValue: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'cost_basis',
    nullable: true,
  })
  costBasis: number;

  @Column({ name: 'as_of_date' })
  asOfDate: Date;

  @ManyToOne(() => Account, (account) => account.positions)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
