export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type PermissionSection =
  | 'dashboard'
  | 'users'
  | 'orders'
  | 'notifications'
  | 'ecommerce'
  | 'outlet'
  | 'dynamicSection'
  | 'offers';

export type SectionPermissions = {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type UserPermissions = {
  [key in PermissionSection]?: SectionPermissions;
};
