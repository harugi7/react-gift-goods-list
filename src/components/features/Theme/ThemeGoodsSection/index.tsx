import styled from '@emotion/styled';
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchData } from '@/components/api';
import { DefaultGoodsItems } from '@/components/common/GoodsItem/Default';
import { Container } from '@/components/common/layouts/Container';
import { Grid } from '@/components/common/layouts/Grid';
import Loading from '@/components/common/Loading/Loading';
import { breakpoints } from '@/styles/variants';
import type { GoodsData } from '@/types';

type Props = {
  themeKey: string;
};

type QueryParams = Record<string, string | number>;

const generateRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const ThemeGoodsSection = ({ themeKey }: Props) => {
  const [currentGoods, setCurrentGoods] = useState<GoodsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchThemeData = useCallback(
    async (pageToken?: string) => {
      setLoading(true);
      try {
        const maxResults = 20;
        const queryParams: QueryParams = pageToken ? { maxResults, pageToken } : { maxResults };

        const data = await fetchData(`/api/v1/themes/${themeKey}/products`, queryParams);
        setCurrentGoods((prevGoods) => [
          ...prevGoods,
          ...data.products.map((product: GoodsData) => ({
            ...product,
            id: generateRandomId(),
          })),
        ]);
        setNextPageToken(data.nextPageToken || null);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error fetching theme data:', error.message);
        } else {
          console.error('An unknown error occurred while fetching theme data.');
        }
      } finally {
        setLoading(false);
      }
    },
    [themeKey],
  );

  useEffect(() => {
    setCurrentGoods([]);
    setNextPageToken(null);
    fetchThemeData();
  }, [themeKey, fetchThemeData]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageToken) {
        fetchThemeData(nextPageToken);
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [nextPageToken, fetchThemeData]);

  const renderContent = () => {
    if (currentGoods.length === 0 && loading) {
      return (
        <LoadingWrapper>
          <Loading />
        </LoadingWrapper>
      );
    }

    if (currentGoods.length === 0 && !loading) {
      return <NoItemsMessage>상품이 없어요.</NoItemsMessage>;
    }

    return (
      <Grid
        columns={{
          initial: 2,
          md: 4,
        }}
        gap={16}
      >
        {currentGoods.map((goods) => (
          <DefaultGoodsItems
            key={goods.id}
            imageSrc={goods.imageURL}
            title={goods.name}
            amount={goods.price.sellingPrice}
            subtitle={goods.brandInfo.name}
          />
        ))}
      </Grid>
    );
  };

  return (
    <Wrapper>
      <Container>
        {renderContent()}
        <div ref={loadMoreRef} />
      </Container>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  width: 100%;
  padding: 28px 16px 180px;

  @media screen and (min-width: ${breakpoints.sm}) {
    padding: 40px 16px 360px;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const NoItemsMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #666;
  margin-top: 20px;
`;
