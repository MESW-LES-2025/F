import { Task } from '@prisma/client';

export type TaskWithRelations = Task & {
	house: { name: string };
	assignee?: {
		name: string | null;
		email: string;
		username: string | null;
	} | null;
	createdBy?: {
		name: string | null;
		email: string;
		username: string | null;
	} | null;
	assigneeLinks?: {
		user: {
			id: string;
			name: string | null;
			imageUrl?: string | null;
			username: string;
		};
	}[];
};
