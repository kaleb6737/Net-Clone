import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, onSnapshot } from 'firebase/firestore';
import db from '../firebase';
import './plansScreen.css';
import { useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { selectUser } from '../features/userSlice';

function PlansScreen() {
    const [products, setProducts] = useState([]);
    const user = useSelector(selectUser);
    const [subscription, setSubscription] = useState(null);

    

    useEffect(() => {
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
        getSubscriptions();
    }, [user.uid]);
    
    console.log(products);
    console.log(subscription);
    

    useEffect(() => {
        const fetchProducts = async () => {
            const productsCollection = collection(db, 'products');
            const q = query(productsCollection, where('active', '==', true));
            const querySnapshot = await getDocs(q);
            const products = {};

            for (const doc of querySnapshot.docs) {
                const productData = doc.data();
                const pricesCollection = collection(doc.ref, 'prices');
                const pricesSnapshot = await getDocs(pricesCollection);

                const prices = pricesSnapshot.docs.map((priceDoc) => ({
                    priceId: priceDoc.id,
                    priceData: priceDoc.data(),
                }));

                products[doc.id] = {
                    ...productData,
                    prices,
                };
            }

            setProducts(products);
        };

        fetchProducts();
    }, []);

    console.log(products);

    const loadCheckout = async (priceId) => {
        const checkoutSessionRef = collection(db, 'customers', user.uid, 'checkout_sessions');
        const session = await addDoc(checkoutSessionRef, {
            price: priceId,
            success_url: window.location.origin,
            cancel_url: window.location.origin,
        });

        const unsubscribe = onSnapshot(session, async (snap) => {
            const { error, sessionId } = snap.data();

            if (error) {
                // Show an error to your customer and 
                // inspect your Cloud Function logs in the Firebase console.
                alert(`An error occurred: ${error.message}`);
            }

            if (sessionId) {
                // We have a session, let's redirect to Checkout
                // Init Stripe
                const stripe = await loadStripe('pk_test_51PcwVJEJszrJB4z7oxE1THrPNthSxwKpmhblXny2crz0ldHmRWiy110X7On2ItJ4Q1ZEC00017CQUZ8sxEDBaZwc00omOZdR7B');
                stripe.redirectToCheckout({ sessionId });
            }
        });

        // Cleanup the listener when it's no longer needed
        return () => unsubscribe();
    };

    return (
        <div className="plansScreen">
            {subscription && <p className = 'renewal__info'> Renewal Date: {new Date(subscription?.current_period_end * 1000).toLocaleDateString()}</p>}

            
            {Object.entries(products).map(([productId, productData]) => {
                // TODO: add some logic to check if the user's subscription is active...
                

                const isCurrentPackage = productData.name
                ?.toLowerCase()
                .includes(subscription?.role);


                return (
                <div key={productId}
                    className={`${isCurrentPackage && "plansScreen__plan--disabled"} plansScreen__plan`}>
                   <div className="plansScreen__info">
                       <h5>{productData.name}</h5>
                       <h6>{productData.description}</h6>
                   </div>
               
                   <button onClick={() => !isCurrentPackage && loadCheckout(productData.prices.priceId)}>
                       {isCurrentPackage ? "Current Package" : "Subscribe"}
                   </button>
               </div>
               
                );
            })}
        </div>
    );
}

export default PlansScreen;
