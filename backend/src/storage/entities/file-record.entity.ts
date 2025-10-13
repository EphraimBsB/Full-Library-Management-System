import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import * as fileMetadataInterface from '../interfaces/file-metadata.interface';

@Entity()
export class FileRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  originalName: string;

  @Column()
  storagePath: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  @Column('simple-json', { nullable: true })  // Changed from 'jsonb' to 'simple-json'
  metadata: fileMetadataInterface.FileMetadata;

  @Column()
  @Index()
  userId: string;

  @Column({ default: false })
  @Index()
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  @Index()
  deletedAt: Date;

  /**
   * Gets the public URL for this file
   * @param baseUrl The base URL of the storage service (e.g., 'http://localhost:3000')
   */
  getUrl(baseUrl: string): string {
    return `${baseUrl}/files/${this.id}`;
  }

  // For backward compatibility
  get url(): string {
    return this.getUrl('');
  }

  // Set URL is a no-op since it's computed
  set url(_: string) {
    // Intentionally empty - url is computed
  }
}
