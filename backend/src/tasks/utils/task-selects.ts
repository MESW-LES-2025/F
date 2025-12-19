export const PRISMA_TASK_USER_SELECT = {
	id: true,
	name: true,
	email: true,
	username: true,
	imageUrl: true,
};

export const PRISMA_TASK_HOUSE_SELECT = {
	id: true,
	name: true,
};

export const PRISMA_TASK_ASSIGNEE_LINKS_INCLUDE = {
	user: {
		select: {
			id: true,
			name: true,
			imageUrl: true,
			username: true,
		},
	},
};

export const PRISMA_TASK_INCLUDE = {
	assignee: {
		select: PRISMA_TASK_USER_SELECT,
	},
	createdBy: {
		select: PRISMA_TASK_USER_SELECT,
	},
	house: {
		select: PRISMA_TASK_HOUSE_SELECT,
	},
	assigneeLinks: {
		include: PRISMA_TASK_ASSIGNEE_LINKS_INCLUDE,
	},
};
