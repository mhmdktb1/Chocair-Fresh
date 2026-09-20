import React from 'react';
import { Sparkles, PackageCheck, Truck, ShieldCheck, Leaf, Clock, Award, Heart, CheckCircle2 } from 'lucide-react';
import './FeaturesSection.css';

const defaultOfferings = [
	{
		id: 1,
		icon: Sparkles,
		iconName: 'Sparkles',
		title: 'Carefully Selected',
		description: 'Fresh, quality produce carefully chosen for every order.',
	},
	{
		id: 2,
		icon: PackageCheck,
		iconName: 'PackageCheck',
		title: 'Checked & Packed',
		description: 'Every item is checked and neatly packed before it leaves us.',
	},
	{
		id: 3,
		icon: Truck,
		iconName: 'Truck',
		title: 'Fast Delivery',
		description: 'Your order arrives quickly, fresh and ready for your kitchen.',
	},
	{
		id: 4,
		icon: ShieldCheck,
		iconName: 'ShieldCheck',
		title: 'Quality Guarantee',
		description: 'Not satisfied with something? We’ll make it right.',
	},
];

const getIconComponent = (iconName, fallback = Sparkles) => {
	if (!iconName) return fallback;
	if (typeof iconName !== 'string') return iconName;
	switch (iconName.toLowerCase()) {
		case 'sparkles':
		case 'sparkle':
			return Sparkles;
		case 'packagecheck':
		case 'package':
		case 'packed':
		case 'box':
			return PackageCheck;
		case 'truck':
		case 'delivery':
			return Truck;
		case 'shieldcheck':
		case 'shield':
		case 'guarantee':
			return ShieldCheck;
		case 'checkcircle':
		case 'checkcircle2':
			return CheckCircle2;
		case 'leaf':
		case 'organic':
			return Leaf;
		case 'clock':
			return Clock;
		case 'award':
			return Award;
		case 'heart':
			return Heart;
		default:
			return fallback;
	}
};

const FeaturesSection = ({ data }) => {
	const title = data?.title === 'Why Choose Us' || !data?.title ? 'What We Offer' : data.title;

	const items = React.useMemo(() => {
		if (data?.items && Array.isArray(data.items) && data.items.length === 4) {
			const isOldDefault = data.items.some(it => it.title === '100% Organic');
			if (!isOldDefault) {
				return data.items.map((item, index) => ({
					id: item._id || item.id || index + 1,
					icon: getIconComponent(item.icon, defaultOfferings[index]?.icon || Sparkles),
					title: item.title || defaultOfferings[index]?.title,
					description: item.description || defaultOfferings[index]?.description,
				}));
			}
		}
		return defaultOfferings;
	}, [data]);

	return (
		<section className="section-offerings" aria-label="What We Offer">
			<div className="container">
				<div className="offerings-header">
					<h2 className="offerings-title">{title}</h2>
				</div>
				<div className="offerings-grid">
					{items.map((item) => {
						const IconComponent = item.icon;
						return (
							<div key={item.id} className="offering-card">
								<div className="offering-icon-wrapper" aria-hidden="true">
									<IconComponent size={24} strokeWidth={1.8} />
								</div>
								<h3 className="offering-title">{item.title}</h3>
								<p className="offering-desc">{item.description}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default FeaturesSection;
