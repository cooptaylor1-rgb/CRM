import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'last_login' })
  lastLogin: Date;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  private originalPassword: string;

  @BeforeInsert()
  async hashPasswordOnInsert() {
    // Always hash on insert
    if (this.password && !this.password.startsWith('$2b$')) {
      console.log(`🔒 Hashing password on INSERT for ${this.email}`);
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    // Only hash on update if password was explicitly changed to a non-hashed value
    // bcrypt hashes start with $2b$ (or $2a$, $2y$)
    if (this.password && !this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
      console.log(`🔒 Hashing password on UPDATE for ${this.email}`);
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    console.log(`🔒 Validating password for ${this.email}, hash starts with: ${this.password?.substring(0, 10)}`);
    const result = await bcrypt.compare(password, this.password);
    console.log(`🔒 Password validation result: ${result}`);
    return result;
  }

  get roleNames(): string[] {
    return this.roles?.map((role) => role.name) || [];
  }
}
