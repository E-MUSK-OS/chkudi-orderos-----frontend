interface Props {
  open: boolean;
  loading: boolean;
  trackingId?: string;

  onClose: () => void;
  onDelete: () => void;
}