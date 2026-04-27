import { useState } from 'react';
import CustomerHeader from '../../components/common/CustomerHeader.jsx';
import CartItem from '../../components/cart/CartItem.jsx';
import CartSummary from '../../components/cart/CartSummary.jsx';
import FinalSummaryModal from '../../components/cart/FinalSummaryModal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Icon from '../../components/common/Icon.jsx';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js