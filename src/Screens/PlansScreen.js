import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, onSnapshot } from 'firebase/firestore';
import db from '../firebase';
import './plansScreen.css';
import { useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { selectUser } from '../features/userSlice';

function PlansScreen() {
    const [products, setProducts] = useState({});
    const user = useSelector(selectUser);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        // Fetch subscription details
        const getSubscriptions = async () => {
            const subscriptionsSnapshot = await getDocs(collection(db, 'customers', user.uid, 'subscriptions'));
            subscriptionsSnapshot.forEach((subscription) => {
                setSubscription({
                    role: subscription.data().role,
                    current_period_end: subscription.data().current_period_end.seconds,
                    current_period_start: subscription.data().current_period_start.seconds,
                });
            });
        };
        if (user.uid) {
            getSubscriptions();
        }
    }, [user.uid]);

    useEffect(() => {
        // Fetch all active products
        const fetchProducts = async () => {
            const productsCollection = collection(db, 'products');
            const q = query(productsCollection, where('active', '==', true));
            const querySnapshot = await getDocs(q);
            const newProducts = {};
    
            for (const doc of querySnapshot.docs) {
                const productData = doc.data();
                const pricesCollection = collection(doc.ref, 'prices');
                const pricesSnapshot = await getDocs(pricesCollection);
                const prices = pricesSnapshot.docs.map((priceDoc) => ({
                    priceId: priceDoc.id,
                    priceData: priceDoc.data(),
                }));
    
                newProducts[doc.id] = {
                    ...productData,
                    prices,
                };
            }
    
            setProducts(newProducts);
        };
    
        fetchProducts();
    }, []);

    const loadCheckout = async (priceId) => {
        const stripePromise = loadStripe('pk_test_51PcwVJEJszrJB4z7oxE1THrPNthSxwKpmhblXny2crz0ldHmRWiy110X7On2ItJ4Q1ZEC00017CQUZ8sxEDBaZwc00omOZdR7B');
        const stripe = await stripePromise;
        const checkoutSessionRef = collection(db, 'customers', user.uid, 'checkout_sessions');
        const sessionDocRef = await addDoc(checkoutSessionRef, {
            price: priceId,
            success_url: window.location.origin + '/success',
            cancel_url: window.location.origin + '/canceled',
        });
    
        const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
            const { error, sessionId } = snap.data();
            if (error) {
                alert(`An error occurred: ${error.message}`);
            }
            if (sessionId) {
                stripe.redirectToCheckout({ sessionId });
            }
        });
    
        return () => unsubscribe();
    };
    

    return (
        <div className="plansScreen">
            {subscription && (
                <p className='renewal__info'>Renewal Date: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
            )}
            {Object.entries(products).map(([productId, productData]) => {
                const isCurrentPackage = productData.name.toLowerCase().includes(subscription?.role);

                return (
                    <div key={productId}
                        className={`${isCurrentPackage ? "plansScreen__plan--disabled" : ""} plansScreen__plan`}>
                        <div className="plansScreen__info">
                            <h5>{productData.name}</h5>
                            <h6>{productData.description}</h6>
                        </div>
                        <button 
                            onClick={() => !isCurrentPackage && loadCheckout(productData.prices[0].priceId)}
                            disabled={isCurrentPackage}>
                            {isCurrentPackage ? "Current Package" : "Subscribe"}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default PlansScreen;
